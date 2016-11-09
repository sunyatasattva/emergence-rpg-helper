const fabric = require('fabric').fabric;
const extend = fabric.util.object.extend;
const Entity = require('./entity');

import Rules from '../modules/rules';

/**
 * Walker class
 * @class Walker
 * @extends Entity
 * @mixes fabric.Circle.prototype
 */
const Walker = fabric.util.createClass(Entity, fabric.Circle.prototype, {
  attributes: {
    movement: 1
  },
  
  coveredSides: {},
  defaultFill: '#f1cc16',
  exposedColor: '#f1cc16',
  fullyCoveredColor: '#43de5d',
  partiallyCoveredColor: '#43a2de',
  includeDefaultValues: false,
  originX: 'center',
  originY: 'center',
  
  // @todo this entity is technically pathable (i.e. other objects)
  // can take a path through it), but currently pathing is not really
  // implemented and this object should block stopping movement on
  // itself, which is what this is about for now
  pathable: false,
  showRangeOnSelected: 'movement',
  snapToMovementRange: true,
  targetable: true,
  type: 'walker',
  
  /**
   * Constructor
   * @param {Array} [points] Array of points
   * @param {Object} [options] Options object
   * @return {Entity} thisArg
   */
  initialize(options = {}) {
    this.callSuper('initialize', options);

    this._allowRotationOnly();
    this.set('allowedLeft', this.left);
    this.set('allowedTop', this.top);
    
    if(this.showRangeOnSelected) {
      this.on('selected', () => {
        if(this.showRangeOnSelected === 'movement')
          this.showMovementRange();
      });
    }
    
    this.on('deselected', () => {
      this.destroyTilesHighlightedByThis();
    });
    
    this.on('added', () => {
      this._updateCoverStatus();
    });
    
    this.on('modified', () => {
      this._updateCoverStatus();
    });
  },
  
  // @todo refactor this in a mixin
  calculateChanceToHit(target) {
    return Rules.calculateChanceToHit(this, target);
  },
  
  calculateMovementRange() {
    let movementRange,
        dashingRange,
        totalRange;
    
    movementRange = this.canvas.calculateRange(
      this.gridPosition[0],
      this.attributes.movement,
      1
    );
    
    dashingRange = this.canvas.calculateRange(
      this.gridPosition[0],
      this.attributes.movement * 2,
      this.attributes.movement + 1
    );
    
    totalRange = movementRange.concat(dashingRange);
    
    return {
      movementRange: movementRange,
      dashingRange: dashingRange,
      totalRange: totalRange.concat(this.gridPosition)
    };
  },
  
  calculateVisionRange() {
    return this.canvas.calculateRange(
      this.gridPosition[0],
      this.attributes.vision,
      1
    );
  },
  
  destroyTilesHighlightedByThis() {
    let highlightedTiles = this.highlightedTiles;
    
    if(highlightedTiles && highlightedTiles.length) {
      highlightedTiles.forEach((o) => {
        this.canvas.remove(o);
      });

      this.canvas.renderAll();
    }
    
    return this;
  },
  
  displayNameLabel() {
    return this.displayLabel(this.attributes.name, {
      icon: 'person'
    });
  },
  
  getValidTargets() {
    return this.canvas.getActiveObjects('walker')
      .filter((target) => {
        return target.targetable
               && target !== this
               && this.isWithinVisionRange(target)
      });
  },
  
  highlightAllHitChances() {
    let possibleTargets = this.getValidTargets();
    
    this.showVisionRange();

    possibleTargets.forEach((target) => {
      target._highlightChanceToBeHitBy(this);
    });
  },
  
  isWithinMovementRange(targetTile) {
    return this.maxMovementRange.totalRange.some((tile) => {
      return tile.x === targetTile.x && tile.y === targetTile.y;
    });
  },
  
  isWithinVisionRange(target) {
    let thisCenter = this._calculateCenterCoordinates(),
        targetCenter;
    
    if(target.gridPosition) {
      targetCenter = target._calculateCenterCoordinates();
    }
    else if(target.x && target.y) {
      targetCenter = target;
    }
    else {
      console.error("Invalid target:", target);
      
      return false;
    }
    
    return this.canvas
        .calculateOctileDistance(thisCenter, targetCenter) 
        <= this.attributes.vision;
  },
  
  showMovementRange(showDashing = true) {
    let range = this.calculateMovementRange(),
        movementTiles,
        dashingTiles;
    
    movementTiles = this.canvas.highlightTiles(range.movementRange, {
      highlightType: 'pathableOnly'
    });
    
    if(showDashing) {
      dashingTiles = this.canvas.highlightTiles(range.dashingRange, {
        // @todo colors shouldn't be hardcoded
        color: '#ffff00',
        highlightType: 'pathableOnly'
      });
    };
    
    this.destroyTilesHighlightedByThis();
    this.highlightedTiles = [movementTiles, dashingTiles];
    
    return this.highlightedTiles;
  },
  
  resetVisualStatus() {
    this
      .removeCurrentLabel()
      ._resetDefaultColor();
    
    this.canvas.renderAll();
    
    return this;
  },
  
  showVisionRange() {
    let range = this.calculateVisionRange(),
        visionTiles;
    
    visionTiles = this.canvas.highlightTiles(range, {
      color: '#000',
      opacity: 0.1
    });
    
    this.destroyTilesHighlightedByThis();
    this.highlightedTiles = [visionTiles];
    
    return this.highlightedTiles;
  },
  
  toObject: function(props = []) {
    props = props.concat([
      'attributes',
      'showRangeOnSelected',
      'radius'
    ]);
    
    return this.callSuper('toObject', props);
  },
  
  _highlightChanceToBeHitBy(source) {
    let chanceToHit = source.calculateChanceToHit(this),
        cover = Rules.isTargetInCoverRelativeToSource(source, this);
    
    this.displayLabel(`${chanceToHit}%`, { icon: 'gps_fixed' });
    
    if(cover > 0) {
      this.set(
        'fill',
        cover === 1 ?
          this.partiallyCoveredColor :
          this.fullyCoveredColor
      );
      
      this.canvas.renderAll();
    }
  },
  
  _onObjectAdded() {
    this.callSuper('_onObjectAdded');
    this._updateCoverStatus();
    this.maxMovementRange = this.calculateMovementRange();
    
    // @todo refactor to _updateMaxMovementRange
    this.on('deselected', () => {
      this.maxMovementRange = this.calculateMovementRange();
    });
  },
  
  _resetDefaultColor() {
    return this.set('fill', this.defaultFill);
  },
  
  // @todo this method is copied to Entity as well, refactor
  // this to include only movement range
  _snapToPathableGrid() {
    let tileSize = this.canvas.tileSize,
        targetCoords = {
        x: Math.floor(this.left / tileSize) * tileSize + tileSize * 0.5,
        y: Math.floor(this.top / tileSize) * tileSize + tileSize * 0.5
      },
        targetTile = this.canvas.getTileFromCoordinates(
          targetCoords.x,
          targetCoords.y
        );

    if(
        ( this.snapToMovementRange
        && this.isWithinMovementRange(targetTile) )
        || !this.snapToMovementRange
      ){
        if( this.canvas.isOccupied(targetTile) === this
            || this.canvas.isPathable(targetTile) ) {
          this.allowedLeft = targetCoords.x;
          this.allowedTop = targetCoords.y;
        }
      }

      this.set({
        left: this.allowedLeft,
        top: this.allowedTop
      });
  },
  
  _updateCoverStatus() {
    let covers = this.canvas.activeObjects.filter(
      (obj) => obj.type === 'cover'
    ),
        covering = covers.filter((cover) => {
          return this.isAdjacentToObject(cover);
        })
        .map((cover) => {
          // @todo refactor this [0] feels like an hack
          // introduced it because I am thinking of covers
          // for characters larger than a tile...
          return {
            cover: cover,
            tiles: this.getAdjacentTilesOfObject(cover)[0]
          }
        })
        .map((cover) => {
          return {
            cover: cover.cover,
            side: this.calculateRelativeDirectionTo(cover.tiles)
          }
        });
    
    this.set('coveredSides', { N: 0, E: 0, S: 0, W: 0 });
    
    covering.forEach((cover) => {
      this.coveredSides[cover.side] = 
        cover.cover.coverType === 'partial' ? 1 : 2;
    });
    
    console.log('Cover status updated:', this.coveredSides);
  }
});

Walker.fromObject = function(object) {
  return new Walker(object);
}

fabric.Walker = Walker;

module.exports = Walker;
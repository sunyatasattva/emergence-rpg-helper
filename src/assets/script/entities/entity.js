const fabric = require('fabric').fabric;
const extend = fabric.util.object.extend;
const Label = require('./label');

/**
 * Cover class
 * @class Entity
 * @extends fabric.Object
 */
const Entity = fabric.util.createClass(fabric.Object, {
  
  hasControls: false,
  
  /**
   * If other objects can move through this object.
   *
   * @type {Boolean}
   * @default
   */
  pathable: true,
  
  /**
   * Constructor
   * @param {Array} [points] Array of points
   * @param {Object} [options] Options object
   * @return {Entity} thisArg
   */
  initialize(options = {}) {
    this.callSuper('initialize', options);

    this.on('added', () => {
      this.updateGridCoordinates();
      
      this._onObjectAdded();
    });
    
    this.on('modified', () => {
      this.updateGridCoordinates();
    });
  },
  
  calculateRelativeDirectionTo(to, center = true) {
    return this.canvas
          .calculateRelativeDirection(this, to, center);
  },
  
  displayLabel(str) {
    this.currentLabel = new Label(str, {
      icon: { icon: 'gps_fixed' },
      left: this.left,
      top: this.top
    });
    
    return this.canvas.add(this.currentLabel);
  },
  
  getAdjacentTilesOfObject(obj) {
    return obj.gridPosition.filter((tileA) => {
      return this.gridPosition.some((tileB) => {
        return this.canvas.calculateOctileDistance(
          tileA, tileB) === 1;
      });
    }); 
  },
  
  isAdjacentToObject(obj) {
    return this.gridPosition.some((tileA) => {
      return obj.gridPosition.some((tileB) => {
    return this.canvas.calculateOctileDistance(
          tileA, tileB) === 1;
      });
    }); 
  },
  
  removeCurrentLabel() {
    return this.canvas.remove(this.currentLabel);
  },
  
  toObject: function(props = []) {
    props = props.concat([
      'gridPosition'
    ]);

    return this.callSuper('toObject', props);
  },
  
  updateGridCoordinates() {
    // fabric calculates widths a bit badly, with an error, should
    // dive into it
    let tileSize = this.canvas.tileSize + 1,
        startTile = this.canvas.getTileFromCoordinates(
                       this.left, this.top),
        size = {
          x: Math.round(this.getWidth() / tileSize),
          y: Math.round(this.getHeight() / tileSize)
        },
        occupiedTiles = [];
    
    for(let w = 0; w < size.x; w++) {
      occupiedTiles.push(
        { x: startTile.x + w, y: startTile.y });

      for(let h = 1; h < size.y; h++) {
        occupiedTiles.push(
          { x: startTile.x + w, y: startTile.y + h});
      }
    }

    this.gridPosition = occupiedTiles;
    
    return this.gridPosition;
  },
  
  _allowRotationOnly() {
    this.set('hasControls', true);
    this.set('centeredRotation', true);

    this.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        tr: false,
        tl: false,
        br: false,
        bl: false
    });
  },
  
  _calculateCenterCoordinates() {
    let averageX = this.gridPosition.reduce(
      (prev, curr) => prev + curr.x, 0) / this.gridPosition.length,
        averageY = this.gridPosition.reduce(
      (prev, curr) => prev + curr.y, 0) / this.gridPosition.length;
    
    return {
      x: averageX,
      y: averageY
    };
  },
});

Entity.fromObject = function(object) {
  return new Entity(object);
}

// Adding to fabric namespace to allow for enliven without
// specifying namespaces. Might want to have a custom namespace,
// but in that case will need to change the load function
fabric.Entity = Entity;

module.exports = Entity;
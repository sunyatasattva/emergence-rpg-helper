const fabric = require('fabric').fabric;
const Entity = require('./entity');
const Line   = require('./line'); 

/**
 * Cover class
 * @class Cover
 * @extends Entity
 * @mixes fabric.Rect.prototype
 */
const Cover = fabric.util.createClass(Entity, fabric.Rect.prototype, {

  /**
   * Type of an object.
   *
   * @type {String}
   * @default
   */
  type: 'cover',

  /**
   * Type of the cover.
   *
   * @type {String} ['full','partial']
   * @default
   */
  coverType: 'full',

  /**
   * When set to `false`, an object can not be selected for 
   * modification (using either point-click-based or group-based
   * selection). But events still fire on it.
   *
   * @type {Boolean}
   * @default
   */
  selectable: false,
  
  /**
   * If other objects can move through this object.
   *
   * @type {Boolean}
   * @default
   */
  pathable: false,

  /**
   * Constructor
   * @param {Array} [points] Array of points
   * @param {Object} [options] Options object
   * @return {fabric.Line} thisArg
   */
  initialize: function(options = {}) {
    this.callSuper('initialize', options);

    this.on('added', () => {
      this._createCoverLines();
    });
  },
  
  _coverPlaneOpts: {
    stroke: '#000',
    type: 'coverPlane',
    visible: false,
    parent: this
  },
  
  _coverSideOpts: {
    stroke: '#ffff00',
    strokeWidth: 2,
    type: 'coverSide',
    visible: false,
    parent: this
  },
  
  _createCoverLines(options) {
    let coverPlaneTop,
        coverPlaneRight,
        coverPlaneBottom,
        coverPlaneLeft,
        coverSideTop,
        coverSideRight,
        coverSideBottom,
        coverSideLeft;
        
    coverPlaneTop = new Line(
      [0, this.top, this.canvas.getWidth(), this.top],
      this._coverPlaneOpts
    );

    coverPlaneLeft = new Line(
      [this.left, 0, this.left, this.canvas.getHeight()],
      this._coverPlaneOpts
    );

    coverPlaneBottom = new Line(
      [0, this.top + this.height, this.canvas.getWidth(),
      this.top + this.height], this._coverPlaneOpts
    );

    coverPlaneRight = new Line(
      [this.left + this.width, 0,
       this.left + this.width, this.canvas.getHeight()],
      this._coverPlaneOpts
    );

    // @todo for nice effect substitute these with shields paths
    coverSideTop = new Line(
      [this.left, this.top, this.left + this.width, this.top],
      this._coverSideOpts
    );

    coverSideLeft = new Line(
      [this.left, this.top, this.left, this.top + this.height], 
      this._coverSideOpts
    );

    coverSideBottom = new Line(
      [this.left, this.top + this.height,
       this.left + this.width, this.top + this.height],
      this._coverSideOpts
    );

    coverSideRight = new Line(
      [this.left + this.width, this.top,
       this.left + this.width, this.top + this.height],
      this._coverSideOpts
    );

    let coverLines = [
      { plane: coverPlaneTop, side:  coverSideTop },
      { plane: coverPlaneRight, side:  coverSideRight },
      { plane: coverPlaneBottom, side:  coverSideBottom },
      { plane: coverPlaneLeft, side:  coverSideLeft }
    ];

    coverLines.forEach((lines) => {
      this.canvas.add(lines.plane);
      this.canvas.add(lines.side);
    });

    this.covers = coverLines;
  }
});

module.exports = Cover;
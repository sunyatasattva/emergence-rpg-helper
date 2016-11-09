export default {
  calculateChanceToHit(source, target) {
    let mod;
    
    mod = [
      this._hitModCover,
      this._hitModWounds
    ].reduce((sum, modifier) => {
      return sum + modifier.call(this, source, target);
    }, 0);
    
    return source.attributes.aim - target.attributes.reflexes + mod;
  },
  isTargetInCoverRelativeToSource(source, target) {
    let sourceDirection;
    
    if(!target.coveredSides)
      return false;
    else {
      sourceDirection = this._adjustRelativeDirectionBySideStepping(
        source,
        target,
        target.calculateRelativeDirectionTo(source)
      )
      
      return sourceDirection.split('')
        .map( (direction) => target.coveredSides[direction] )
        .reduce( (p,c) => Math.max(p,c) );
    }
  },
  
  _adjustRelativeDirectionBySideStepping(source, target, direction) {
    let dirs = direction.split(''),
        northOrSouth = dirs.includes('N') || dirs.includes('S'),
        eastOrWest = dirs.includes('E') || dirs.includes('W'),
        sourcePos = source.gridPosition[0],
        targetPos = target.gridPosition[0];
        
    if(northOrSouth && Math.abs(sourcePos.y - targetPos.y) === 1)
      dirs.splice(0,1);
    if(eastOrWest && Math.abs(sourcePos.x - targetPos.x) === 1) {
      dirs.splice(1,1);
    }
      
    return dirs.join('');
  },
  
  _hitModCover(source, target) {
    let targetCover = this.isTargetInCoverRelativeToSource(
          source, target);
    
    return !targetCover ? 0 : targetCover === 1 ? -20 : -40;
  },
  _hitModWounds(source) {
    let wounds = source.attributes.wounds;
    
    return wounds ? wounds * -5 : 0;
  }
}
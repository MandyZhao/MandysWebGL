class LineSegment {
  constructor(x1, y1, x2, y2) {
    this.ptStartX = x1;
    this.ptStartY = y1;

    // If there's only 3 arguments, x2 should be regarded as the angle(Rad)
    if(y2 === undefined) {
      this.theta = x2;
      this.length = 1;// just give 1 as if it's normalized
      this.ptEndX = this.ptStartX + this.length * Math.cos(this.theta);
      this.ptEndY = this.ptStartY + this.length * Math.sin(this.theta);
    } else {
      this.ptEndX = x2;
      this.ptEndY = y2;

      this.length = Wall.getDistance(this.ptStartX, this.ptStartY, this.ptEndX, this.ptEndY);

      // We only need to get the angle (in Rad) of the Ray from start point to end point with X axis
      
      // this.cosine = (this.ptEndX - this.ptStartX) / this.length;
      // this.sine = (this.ptEndY - this.ptStartY) / this.length;

      // result will be (-PI, PI)
      this.theta = Math.atan2(this.ptEndY - this.ptStartY, this.ptEndX - this.ptStartX);
    }
  }
  intersectionTest(wallSeg) {
    const diff = Math.abs(wallSeg.theta - this.theta);
    if(Math.abs(diff) < 0.0001 || Math.abs(diff - Math.PI) < 0.0001) {
      return null;// Parallel. Just use a large value
    }
    const lWall = (Math.cos(this.theta) * wallSeg.ptStartY - Math.cos(this.theta) * this.ptStartY + Math.sin(this.theta) * this.ptStartX - Math.sin(this.theta) * wallSeg.ptStartX) / (Math.sin(this.theta) * Math.cos(wallSeg.theta) - Math.cos(this.theta) * Math.sin(wallSeg.theta));
    if(lWall >= 0 && lWall <= wallSeg.length) {
      // if intersection is within wall's length, it's valid. calcutate length on the light ray
      let lLight = (wallSeg.ptStartX + lWall * Math.cos(wallSeg.theta) - this.ptStartX) / Math.cos(this.theta);
      // negative value means opposite direction, which makes no sense
      if(lLight < 0)
        lLight = null;
      return lLight;
    }
    return null;// no actual intersection!!!
  }
}
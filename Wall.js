class Wall {

  static getDistance(x1, y1, x2, y2) {
    const diffX = x2 - x1;
    const diffY = y2 - y1;
    return Math.sqrt(diffX * diffX + diffY * diffY);
  }

  // Something like：
  // First param: The point coordinates provides in an array, they
  // could be connect on after another to get a closed polygon!  
  // [ 0.0, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5 ]
  // Second Param: The connection order of the the points in order to get a closed polygon
  // [ 0, 1, 3, 2 ]
  constructor(pointArray, connectIndicies) {
    this.points = pointArray;
    this.connectIndicies = connectIndicies;

    // Create LineSegments (for intersection detection)
    this.LineSegments = [];
    for(let i = 1; i < this.connectIndicies.length; i += 1) {
      const ind = this.connectIndicies[i];
      const prevInd = this.connectIndicies[i - 1]
      this.LineSegments.push(new LineSegment(this.points[prevInd * 2], this.points[prevInd * 2 + 1], this.points[ind * 2], this.points[ind * 2 + 1]))
    }

    // Connect the last vertex to the first
    const l = this.connectIndicies.length;
    if( l >= 4) {
      const lastInd = this.connectIndicies[l - 1];
      const firstInd = this.connectIndicies[0];

      this.LineSegments.push(new LineSegment(this.points[lastInd * 2], this.points[lastInd * 2 + 1], this.points[firstInd * 2], this.points[firstInd * 2 + 1]));
    }
    // console.log(this.LineSegments);
  }
}
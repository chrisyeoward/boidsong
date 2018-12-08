class Bounds {
  
  PVector frontTopLeft; 
  PVector frontTopRight; 
  PVector frontBottomLeft; 
  PVector frontBottomRight; 
  PVector backTopLeft; 
  PVector backTopRight; 
  PVector backBottomLeft; 
  PVector backBottomRight;
  
  Bounds(PVector frontTopLeft, 
  PVector frontTopRight, 
  PVector frontBottomLeft, 
  PVector frontBottomRight, 
  PVector backTopLeft, 
  PVector backTopRight, 
  PVector backBottomLeft, 
  PVector backBottomRight) {
    this.frontTopLeft = frontTopLeft; 
    this.frontTopRight = frontTopRight; 
    this.frontBottomLeft = frontBottomLeft; 
    this.frontBottomRight = frontBottomRight; 
    this.backTopLeft = backTopLeft; 
    this.backTopRight = backTopRight; 
    this.backBottomLeft = backBottomLeft; 
    this.backBottomRight = backBottomRight;
  }
  
  float distanceFromLeftPlane(PVector point) {
    return 0;
  }
  
  float distanceFromRightPlane(PVector point) {
    return 0;
  }
  
  float distanceFromFrontPlane(PVector point) {
    return 0;
  }
  
  float distanceFromBackPlane(PVector point) {
    return 0;
  }
  
  float distanceFromTopPlane(PVector point) {
    return 0;
  }
  
  float distanceFromBottomPlane(PVector point) {
    return 0;
  }
}

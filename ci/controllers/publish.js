const Font = require("../models/font");

/**
 * @class
 */
module.exports = class PublishController{

  /**
   * - Compute the new version (auto-patch until better changelog detection)
   * - Create the manifest
   * - Create the version
   * - Publish the font to npm
   * - Publish the font to s3
   * 
   * @param {Object} options
   * @param {Font} options.font
   */
  static send({ font }){
    return new Promise((resolve, reject) => {
      console.log(font._changes.toString());
    })
  }

  version(){

  }
}
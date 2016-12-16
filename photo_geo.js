// modified from https://github.com/clhenrick/bushwick_survey/blob/master/scripts/parse_photos.js
// script to grab lat lon data from images
// processes a director of images and writes a geojson file containing the image name, lat, lon, modify data
// usage: touch photos.json && node photo_geo.js > photos.json

var fs = require('graceful-fs');
var path = require('path');
var ExifImage = require('exif').ExifImage;
var exifCount = 0;
var photoCount = 0;
var imgDir = path.join(__dirname, './images/');
var imgData = {
                "type" : "FeatureCollection",
                "crs": {
                  "type": "name",
                  "properties": {
                    "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
                    }
                  },
                "features" : []
              };
var errors = [];

// converts lat lon from Degrees Minutes Seconds to Decimal Degrees
function convertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = degrees + minutes/60 + seconds/(60*60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}

function parseExifData(exifObj, name) {
  var data = {
                "type" : "Feature",
                "geometry" : {
                  "type" : "Point",
                  "coordinates" : [0,0]
                },
                "properties" : {}
              };
  var d = exifObj;
  var imgName = name.split('/')
  data.properties.file_name = imgName[imgName.length-1];
  data.geometry.coordinates[1] = convertDMSToDD(
                            d.gps.GPSLatitude[0],
                            d.gps.GPSLatitude[1],
                            d.gps.GPSLatitude[2],
                            d.gps.GPSLatitudeRef
                            );
  data.geometry.coordinates[0] = convertDMSToDD(
                            d.gps.GPSLongitude[0],
                            d.gps.GPSLongitude[1],
                            d.gps.GPSLongitude[2],
                            d.gps.GPSLongitudeRef
                            );
  data.properties.modify_date = d.image.ModifyDate;

  imgData.features.push(data);
  exifCount ++;

  // console.log('parsed exif data ', data);

  // imgData = JSON.stringify(imgData);
  // errors = JSON.stringify(errors);
  if (exifCount == photoCount) {
    console.log(JSON.stringify(imgData));
  }
}

function readImage(img) {
  try {
      new ExifImage({ image : img }, function (error, exifData) {
          if (error) {
            console.log('error: ', error.message);
            errors.push({name: img, err: error.message});
          }            
          else{
            // console.log(exifData.exif.DateTimeOriginal);
            parseExifData(exifData, img);
          }
      });
  } catch (error) {      
      errors.push({name: img, err: error.message});
  }  
}

function readDataDir(path) {
  var files = fs.readdirSync(path);
  // var count = 0;
  files.forEach(function(file,i) {    
    if (file[0] != '.') {
      file = path + file;
      readImage(file);
      photoCount++
    }
  });
}

// console.log('imgDir: ', imgDir);
readDataDir(imgDir);
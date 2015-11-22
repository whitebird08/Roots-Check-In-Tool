var mongoose = require('mongoose');

var zoneSchema = mongoose.Schema ({
  "zone-flex": [],
  "zone-maker": [],
  "zone-ipad": [],
  "zone-library": [],
  "zone-writing": []
});

module.exports = mongoose.model('zone', zoneSchema);

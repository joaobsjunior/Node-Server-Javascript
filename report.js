let Report = require('./node_modules/fluentreports' ).Report;

var data = [{name: 'Elijah', age: 18}, {name: 'Abraham', age: 22}, {name: 'Gavin', age: 28}];

  // Create a Report  
  var rpt = new Report("Report.pdf")        
        .pageHeader( ["Employee Ages"] )      // Add a simple (optional) page Header...        
        .data( data )                         // Add some Data (This is required)
        .detail( [['name', 200],['age', 50]]) // Layout the report in a Grid of 200px & 50px
        .render();        
/**
 * Created by anto on 13/04/17.
 */



var barYearlyChart = dc.barChart("#digitalisation_yearly", "chartgrouptest");
var barMonthlyChart = dc.barChart("#digitalisation_monthly","chartgrouptest");

// data parsing function
var dateFormat = d3.time.format("%d/%m/%y");
function toObj(d) {
    var convertedDate = dateFormat.parse(d.date);
    return {
        date: convertedDate, // parse dates as js Date objects
        month : d3.time.month.floor(convertedDate),
        year : d3.time.year.floor(convertedDate).getFullYear(),
        txDigitalization: d3.round(+d.TxDigitalization * 100) // coerce to number in %
    };
}

// map reduce functions to compute aggregations (monthly, yearly mean values)
function reduceAddAvg(field){
    return function reduceAddAvg(p,v) {
        ++p.count;
        p.sum += v[field];
        p.avg = p.sum/p.count;
        return p;
    };
}
function reduceRemoveAvg(field){
    return function reduceRemoveAvg(p,v) {
        --p.count
        p.sum -= v[field];
        p.avg = p.sum/p.count;
        return p;
    };
};
function reduceInitAvg() {
    return {count:0, sum:0, avg:0};
};


// parsing input data (we expect 1 record per month, all times that shouldn't get too big)
d3.tsv("data/fake_digitalization_rate.tsv", toObj,  function(error, experiments) {

    // Prepare the dataset for visualizations
    // Define dimensions (on which we filter)
    var ndx                 = crossfilter(experiments);
    var dailyDimension      = ndx.dimension(function(d) {return d.date;}); // create a date index
    var yearlyDimension     = ndx.dimension(function(d) {return d3.time.year(d.date);}); // create a date index
    var monthlyDimension    = ndx.dimension(function(d) {return d3.time.month(d.date);});
    // Define aggragation (that will be displayed)
    var yearlyMeanGroup     = dailyDimension.group(function(d) {return d3.time.year(d);})
        .reduce(reduceAddAvg("txDigitalization"),
            reduceRemoveAvg("txDigitalization"),
            reduceInitAvg);
    var monthlyMeanGroup    = dailyDimension.group(function(d) {return d3.time.month(d);})
        .reduce(reduceAddAvg("txDigitalization"),
            reduceRemoveAvg("txDigitalization"),
            reduceInitAvg);

    barYearlyChart
        .width(window.innerWidth/2)
        .height(window.innerHeight/3)
        .margins({top: 50, right: 50, bottom: 50, left: 50})
        .dimension(yearlyDimension,"chartgrouptest")
        .group(yearlyMeanGroup,"chartgrouptest")
        .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2018, 0, 1)]))
        .xUnits(d3.time.year.range)
        .xAxisLabel("Année")
        .y(d3.scale.linear().domain([0, 100]))
        .yAxisLabel("Suivis de commande digitaux (%)")
        .brushOn(false)
        .valueAccessor(function (p) {
            return p.value.avg;
        });

    barYearlyChart.xAxis().ticks(d3.time.year,1);

    barMonthlyChart
        .width(990)
        .height(200)
        .transitionDuration(1000)
        .margins({top: 30, right: 50, bottom: 25, left: 40})
        .dimension(monthlyDimension,"chartgrouptest")
        .mouseZoomable(true)
        .x(d3.time.scale().domain([new Date(2014, 0, 1), new Date(2018, 0, 1)]))
        .round(d3.time.month.round)
        .xUnits(d3.time.months)
        .y(d3.scale.linear().domain([0, 100]))
        .renderHorizontalGridLines(true)
        .brushOn(false)
        .group(monthlyMeanGroup,"chartgrouptest")
        .valueAccessor(function (d) {
            return d.value.avg;
        });

    dc.renderAll("chartgrouptest");

});
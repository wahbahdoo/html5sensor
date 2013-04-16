var params = ['alpha', 'beta', 'gamma'];
var elems = {};

function round2(num) {
    return Math.round(num * 100)/100;
}

function deviceMotionHandler(event) {
    _.each(params, function(param) {
        var elem = elems[param];
        var val = round2(event[param]);
        elem.$val.html(val);
        if (val > elem.max) {
            elem.max = val;
            elem.$max.html(val);
        }
        if (val < elem.min) {
            elem.min = val;
            elem.$min.html(val);
        }
    });
    return false;
}

function init() {
    _.each(params, function(param) {
        elems[param] = {};
        elems[param].$val = $('#' + param);
        elems[param].$max = $('#' + param + 'Max');
        elems[param].$min = $('#' + param + 'Min');
        elems[param].max = -2147483648;
        elems[param].min = 2147483648;
    });
}

$(document).ready(function() {
    init();
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', deviceMotionHandler, false);
    } else {
        alert('no orientation either');
    }
});

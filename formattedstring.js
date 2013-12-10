var FormattedString = function (inner) {
    if (typeof inner !== 'string')
        inner = '';
    var self = this;
    self.control = {};
    var off = 0;
    self.inner = inner.replace(/\x1b[0-9\,]*;/g, function (str, i) {
        self.control[i-off] = str;
        off += str.length;
        return '';
    });
};

FormattedString.prototype = {
    toString: function () {
        var s = this.inner;
        var i = 0;
        for (var k in this.control) {
            k = parseInt(k);
            s = s.substring(0, i + k) + this.control[k] +
                s.substring(i + k);
            i += this.control[k].length;
        }
        return s;
    },

    substring: function (i, end) {
        if (isNaN(end)) {
            end = this.inner.length;
        }
        var ss = this.inner.substring(i, end);
        var control = {};
        for (var k in this.control) {
            k = parseInt(k);
            if (k >= i && k <= i + end) {
                control[k-i] = this.control[k];
            }
        }
        ss = new FormattedString(ss);
        ss.control = control;
        return ss;
    },

    length: function () {
        return this.inner.length;
    }
};

module.exports = FormattedString;

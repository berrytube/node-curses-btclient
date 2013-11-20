var ncurses = require('ncurses');
var Window = ncurses.Window;

var UI = function () {
    this.window = new Window();
    this.nicklist = {
        hidden: false,
        width: 16,
        names: []
    };
    var self = this;
    this.window.on('inputChar', function (char, charcode, isKey) {
        self.handleInput(char, charcode, isKey);
    });
    this.inputbuffer = '';
    this.prompt = '';
    this.messageHandlers = [];
    this.messagebuffer = [];
    process.on('SIGWINCH', function () {
        ncurses.cleanup();
        //self.window.resize(ncurses.lines, ncurses.cols);
        self.window.clearok(true);
        self.window.refresh();
        self.paint();
    });
};

UI.prototype.handleInput = function (char, charcode, isKey) {
    if (!isKey && charcode >= 32 && charcode <= 126) {
        this.inputbuffer += char;
    } else if (charcode === 0x08 || charcode === 0x7f) { // Backspace
        if (this.inputbuffer.length > 0) {
            this.inputbuffer = this.inputbuffer.substring(0, this.inputbuffer.length - 1);
        }
    } else if (charcode === 0x0a || charcode === 0x0d) { // Enter
        if (this.inputbuffer.trim().length > 0) {
            this.handleLine(this.inputbuffer);
            this.inputbuffer = '';
        }
    } else if (charcode === 0x09) { // Tab
        var split = this.inputbuffer.split(' ');
        var target = split[split.length - 1].toLowerCase();
        if (target.trim() !== '') {
            var names = [];
            for (var i = 0; i < this.nicklist.names.length; i++) {
                if (this.nicklist.names[i].name.toLowerCase().indexOf(target) === 0) {
                    names.push(this.nicklist.names[i].name);
                }
            }
            if (names.length === 1) {
                split[split.length - 1] = names[0];
                this.inputbuffer = split.join(' ');
                if (split.length === 1) {
                    this.inputbuffer += ':';
                }
                this.inputbuffer += ' ';
            }
        }
    } else {
        this.inputbuffer += '' + charcode;
    }
    this.paintInput();
};

UI.prototype.handleLine = function (line) {
    var args = line.trim().split(' ');
    var cmd = args[0].toLowerCase();
    if (cmd === '/quit') {
        this.window.close();
        process.exit(0);
    } else if (cmd === '/repaint') {
        this.paint();
    } else if (cmd === '/hide') {
        var what = args[1];
        if (what.toLowerCase() === 'nicklist') {
            this.nicklist.hidden = true;
            this.paint();
        }
    } else if (cmd === '/show') {
        var what = args[1];
        if (what.toLowerCase() === 'nicklist') {
            this.nicklist.hidden = false;
            this.paint();
        }
    } else if (cmd === '/clear') {
        this.messagebuffer = [];
        this.paint();
    } else {
        for (var i = 0; i < this.messageHandlers.length; i++) {
            this.messageHandlers[i](line);
        }
    }
};

UI.prototype.paint = function () {
    this.window.clear();
    this.paintDividers();
    this.paintUserlist();
    this.paintMessageBuffer();
    this.paintInput();
    this.resetCursor();
    this.window.refresh();
};

UI.prototype.resetCursor = function () {
    var cy = this.window.height - 1;
    var cx = this.prompt.length + this.inputbuffer.length;
    if (cx > this.window.width - 1) {
        cx = this.window.width - 1;
    }
    this.window.cursor(cy, cx);
};

UI.prototype.paintInput = function () {
    this.window.cursor(this.window.height - 1, 0);
    this.window.clrtoeol();
    var maxw = this.window.width - this.prompt.length - 1;
    var start = this.inputbuffer.length - maxw;
    if (start < 0) {
        start = 0;
    }
    this.window.print(this.window.height - 1, 0, this.prompt);
    this.window.print(this.window.height - 1, this.prompt.length,
                      this.inputbuffer.substring(start));
    this.resetCursor();
    this.window.refresh();
};

UI.prototype.paintMessageBuffer = function () {
    // Step 1: Extract at most (height) messages in reverse order
    var lines = [];
    for (var i = 0; i < this.messagebuffer.length && i < this.window.height - 2; i++) {
        lines.push(this.messagebuffer[this.messagebuffer.length - i - 1]);
    }

    // Step 2: Split long lines
    var split = [];
    var maxw = this.window.width;
    if (!this.nicklist.hidden) {
        maxw -= this.nicklist.width;
        maxw--;
    }
    for (var i = lines.length - 1; i >= 0; i--) {
        var msg = lines[i];
        if (msg.msg.length < maxw) {
            split.push(msg);
        } else {
            var inner = msg.msg;
            while (inner.length > maxw) {
                split.push({
                    attr: msg.attr,
                    msg: inner.substring(0, maxw)
                });
                inner = inner.substring(maxw);
            }

            if (inner.length > 0) {
                split.push({
                    attr: msg.attr,
                    msg: inner
                });
            }
        }
    }

    // Step 3: Trim to fit screen
    if (split.length > this.window.height - 2) {
        split.splice(0, split.length - (this.window.height - 2));
    }

    // Step 4: Render
    var x = 0;
    if (!this.nicklist.hidden) {
        x += this.nicklist.width + 1;
    }
    for (var i = 0; i < split.length; i++) {
        var msg = split[i];
        if (msg.attr !== false) {
            this.window.attron(msg.attr);
        }
        this.window.print(i, x, msg.msg);
        var x2 = x + msg.msg.length;
        if (x2 < this.window.width) {
            this.window.cursor(i, x2);
            this.window.clrtoeol();
        }
        if (msg.attr !== false) {
            this.window.attroff(msg.attr);
        }
    }

    this.resetCursor();
    this.window.refresh();
};

UI.prototype.paintDividers = function () {
    /* Draw nicklist */
    if (!this.nicklist.hidden) {
        var x = this.nicklist.width;
        this.window.cursor(0, x);
        this.window.vline(this.window.height - 2);
    }

    /* Draw divider for chat input bar */
    var y = this.window.height - 2;
    this.window.cursor(y, 0);
    this.window.hline(this.window.width);

    this.resetCursor();
    this.window.refresh();
};

UI.prototype.paintUserlist = function () {
    if (this.nicklist.hidden) {
        return;
    }
    var maxw = this.window.width - this.nicklist.width - 1;
    for (var i = 0; i < this.nicklist.names.length && i < this.window.height - 2; i++) {
        var user = this.nicklist.names[i];
        this.window.print(i, 0, user.name.substring(0, maxw));
        var x = user.name.length;
        if (x < this.nicklist.width) {
            this.window.cursor(i, x);
            this.window.hline(this.nicklist.width - x, 0x20);
        }
    }

    for (var i = this.nicklist.names.length; i < this.window.height - 2; i++) {
        this.window.cursor(i, 0);
        this.window.hline(this.nicklist.width, 0x20);
    }
    this.resetCursor();
    this.window.refresh();
};

UI.prototype.addUser = function (name, rank) {
    if (name == null) {
        return;
    }

    if (rank == null) {
        rank = 0;
    }

    for (var i = 0; i < this.nicklist.names.length; i++) {
        if (this.nicklist.names[i].name === name) {
            this.nicklist.names[i].rank = rank;
            return;
        }
    }

    this.nicklist.names.push({
        name: name,
        rank: rank
    });

    this.nicklist.names.sort(function (a, b) {
        if (a.rank === b.rank) {
            var x = a.name.toLowerCase();
            var y = b.name.toLowerCase();
            return x === y ? 0 : (x < y ? -1 : 1);
        }

        return a.rank > b.rank ? -1 : 1;
    });
    this.paintUserlist();
};

UI.prototype.removeUser = function (name) {
    if (name == null) {
        return;
    }

    for (var i = 0; i < this.nicklist.names.length; i++) {
        if (this.nicklist.names[i].name === name) {
            this.nicklist.names.splice(i, 1);
        }
    }
    this.paintUserlist();
};

UI.prototype.addMessage = function (message, attr) {
    if (isNaN(attr)) {
        attr = false;
    }
    this.messagebuffer.push({
        attr: attr,
        msg: message
    });
    //this.messagebuffer.push('<' + user + '> ' + message);
    this.paintMessageBuffer();
};

UI.prototype.onMessage = function (fn) {
    this.messageHandlers.push(fn);
};

UI.prototype.unbindMessage = function (fn) {
    var i = this.messageHandlers.indexOf(fn);
    if (i >= 0) {
        this.messageHandlers.splice(i, 1);
    }
};

module.exports.UI = UI;

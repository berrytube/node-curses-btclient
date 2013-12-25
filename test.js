var ncurses = require('ncurses');
var UI = require('./ui').UI;
var ui = new UI();
ui.prompt = '[] ';

var myNick = false;
var colorPair = 1;
ncurses.colorPair(colorPair, 13, 0);
var flutters = ncurses.colorPair(colorPair++);

var onMessage = function (line) {
    var args = line.split(' ');
    var cmd = args[0].toLowerCase();
    if (cmd === '/nick') {
        myNick = args[1];
        ui.prompt = '[' + myNick + '] ';
    } else {

    }
};

ui.onMessage(onMessage);
ui.paint();

ui.addMessage('<cyzon> \x1b' + ncurses.attrs.UNDERLINE + ';underlined\x1b0; not underlined');
ui.addMessage('<cyzon> \x1b' + ncurses.attrs.BOLD + ';bold \x1b0; not bold');
ui.addMessage('<cyzon> \x1b' + flutters + ';yay \x1b0; not yay');

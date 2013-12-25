var ncurses = require('ncurses');
var io = require('socket.io-client');
var UI = require('./ui').UI;
var ui = new UI();
ui.prompt = '[] ';

var myNick = false;
var colorPair = 1;
var SQUEE = ncurses.attrs.REVERSE;
ncurses.colorPair(colorPair, 13, 0);
var FLUTTERS = ncurses.colorPair(colorPair++);
var socket = io.connect('96.127.152.99:8344');

socket.on('connect', function () {
    ui.addMessage('-!- Connected to BerryTube');
    socket.emit('myPlaylistIsInited');
});

socket.on('newPoll', function (data) {
    ui.addMessage('* ' + data.creator + ' opened poll: ' + data.title);
    ui.paintMessageBuffer();
});

socket.on('chatMsg', function (data) {
    var nick = data.msg.nick;
    var msg = data.msg.msg;
    msg = msg.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    var attr = false;
    if (myNick && msg.match(new RegExp("(^|\\s)" + myNick + "($|\\W)", "i"))) {
        msg = '\x1b' + SQUEE + ';' + msg + '\x1b0;';
    }
    switch (data.msg.emote) {
        case 'act':
            ui.addMessage('* ' + nick + ' ' + msg, attr);
            break;
        case 'request':
            ui.addMessage('* ' + nick + ' requests ' + msg, attr);
            break;
        case 'sweetiebot':
        case 'spoiler':
        case 'rcv':
            msg = '<' + nick + '.' + data.msg.emote + '> ' + msg;
            if (data.msg.emote === 'rcv')
                msg = '\x1b' + ncurses.attrs.BOLD + ';' + msg + '\x1b0;';
            ui.addMessage(msg, attr);
            break;
        case 'drink':
            var m2 = '\x1b' + ncurses.attrs.BOLD + ';';
            m2 += '[ <' + nick + '> ' + msg + ' drink!';
            if (data.msg.multi > 1) {
                m2 += ' (' + data.msg.multi + ')';
            }
            m2 += ' ]\x1b0;';
            ui.addMessage(m2, attr);
            break;
        default:
            msg = msg.replace(/<strong>(.*?)<\/strong>/g,
                              '\x1b' + ncurses.attrs.BOLD + ';$1\x1b0;');
            msg = msg.replace(/<em>(.*?)<\/em>/g,
                              '\x1b' + ncurses.attrs.UNDERLINE + ';$1\x1b0;');
            msg = msg.replace(/<strike>(.*?)<\/strike>/g,
                              '~~$1~~');
            msg = msg.replace(/<span class="flutter">(.*?)<\/span>/g,
                              '\x1b' + FLUTTERS + ';$1\x1b0;');
            msg = msg.replace(/<span style="font-family: monospace">(.*?)<\/span>/g,
                              '`$1`');
            ui.addMessage('<' + nick + '> ' + msg, attr);
            break;
    }
});

socket.on('newChatList', function (data) {
    data.forEach(function (u) {
        ui.addUser(u.nick, u.type);
    });
});

socket.on('userJoin', function (data) {
    ui.addUser(data.nick, data.type);
});

socket.on('userPart', function (data) {
    ui.removeUser(data.nick);
});

socket.on('forceVideoChange', function (data) {
    var title = decodeURIComponent(data.video.videotitle);
    ui.addMessage('-!- Now Playing: ' + title);
    ui.paintMessageBuffer();
});

socket.on('createPlayer', function (data) {
    var title = decodeURIComponent(data.video.videotitle);
    ui.addMessage('-!- Now Playing: ' + title);
    ui.paintMessageBuffer();
});

socket.on('setNick', function (nick) {
    ui.prompt = '[' + nick + '] ';
    myNick = nick;
    ui.paintInput();
});

var onMessage = function (line) {
    var args = line.split(' ');
    var cmd = args[0].toLowerCase();
    if (cmd === '/nick') {
        socket.emit('setNick', {
            nick: args[1],
            pass: false
        });
    } else {
        socket.emit('chat', {
            msg: line,
            metadata: {
                channel: 'main',
                flair: 0
            }
        });
    }
};

ui.onMessage(onMessage);
ui.paint();

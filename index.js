var ncurses = require('ncurses');
var io = require('socket.io-client');
var UI = require('./ui').UI;
var ui = new UI();
ui.prompt = '[] ';

var socket = io.connect('96.127.152.99:8344');

socket.on('connect', function () {
    ui.messagebuffer.push('-!- Connected to BerryTube');
    ui.paintMessageBuffer();
    socket.emit('myPlaylistIsInited');
});

socket.on('newPoll', function (data) {
    ui.messagebuffer.push('* ' + data.creator + ' opened poll: ' + data.title);
    ui.paintMessageBuffer();
});

socket.on('chatMsg', function (data) {
    var nick = data.msg.nick;
    var msg = data.msg.msg;
    msg = msg.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    switch (data.msg.emote) {
        case 'act':
            ui.messagebuffer.push('* ' + nick + ' ' + msg);
            ui.paintMessageBuffer();
            break;
        case 'request':
            ui.messagebuffer.push('* ' + nick + ' requests ' + msg);
            ui.paintMessageBuffer();
            break;
        case 'sweetiebot':
        case 'spoiler':
        case 'rcv':
            ui.messagebuffer.push('<' + nick + '.' + data.msg.emote + '> ' + msg);
            ui.paintMessageBuffer();
            break;
        case 'drink':
            var m2 = '[ <' + nick + '> ' + msg + ' drink!';
            if (data.msg.multi > 1) {
                m2 += ' (' + data.msg.multi + ')';
            }
            m2 += ' ]';
            ui.messagebuffer.push(m2);
            ui.paintMessageBuffer();
            break;
        default:
            ui.addMessage(nick, msg);
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
    var title = unescape(data.video.videotitle);
    ui.messagebuffer.push('-!- Now Playing: ' + title);
    ui.paintMessageBuffer();
});

socket.on('setNick', function (nick) {
    ui.prompt = '[' + nick + '] ';
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

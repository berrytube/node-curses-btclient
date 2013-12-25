node-curses-btclient
====================

Little berrytube chat client I whipped up in node this afternoon with ncurses.

### Currently Implemented Features
- View berrytube chat
- View berrytube userlist
- Log in as a guest name
- Send messages
- Reacts to resize events (SIGWINCH)
- Displays notifications for video changes, polls

### Installation
1. Clone this repo (`git clone https://github.com/berrytube/node-curses-btclient`)
2. Execute `npm install` in the directory to install dependencies

### Running
- Run `node index.js` in the root directory of the repository

### Commands
- `/nick <name> [<pass>]`: Sends a `setNick` packet to berrytube to log you in.  If `<pass>` is not provided, you will be logged in as a guest.
- `/hide nicklist`: Hides the username list
- `/show nicklist`: Shows the username list
- `/repaint`: Forces ncurses to redraw the whole screen
- `/clear`: Clears the message buffer
- `/quit`: Cleanly quits the client

### Screenshot
![Screenshot](http://i.imgur.com/h0JaFSl.png)


Code by cyzon.  Feel free to contribute suggestions and/or patches.  Cheers.

TicketStatus
============

Web based visualization of ticket status

Live demo: 
http://invision-web.net/ticket-status/

Notes:
- edit ngapp/app.js for customization
- retrieve.php is a dummy script which returns random data
- server response is assumed to be structured as follows: 

{
  info:{
    date:'current date', 
    ... 
  }
  , 
  data:{
    seg1:val1, 
    seg2:val2, 
    ... , 
    segN:valN
  }
}

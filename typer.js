var Typer = {
  accuracy: 0,
  grossWPM: 0,
  netWPM: 0,
  typedEntries: 0,
  counter: -1,
  errors: 0,

  init: function(){
    Typer.resetDefaults();
    setInterval(function(){ 
      console.log("Got into setInterval");
      Typer.counter += 1;
      Typer.calculateSpeed();
    }, 300);
  },

  resetDefaults: function(){
    Typer.accuracy = 0;
    Typer.grossWPM = 0;
    Typer.netWPM = 0;
    Typer.typedEntries = 0;
    Typer.counter = -1;
    Typer.errors = 0;
  },

  sendKey: function(data){
    console.log('data is', data);
    Typer.typedEntries += data.length;
    Typer.errors += data.errors;
  },

  calculateSpeed: function(){
    time = 0.05 + (Typer.counter * 0.05);
    console.log("time", time);
    Typer.grossWPM = (Typer.typedEntries / 5 ) / time;//3 seconds
    Typer.netWPM = Typer.grossWPM - ((Typer.errors/5) / time);//3 seconds
    Typer.accuracy = (Typer.netWPM / Typer.grossWPM) * 100;
    console.log(Typer.grossWPM, Typer.netWPM, Typer.accuracy);
  }
}
Typer.init();
var Typer = {
  accuracy: 0,
  grossWPM: 0,
  netWPM: 0,
  typedEntries: 0,
  counter: -1,
  errors: 0,

  init: function(){
    Typer.resetDefaults();
    calculate = setInterval(function(){ 
      Typer.counter += 1;
      Typer.calculateSpeed();
    }, 300);

    pushDataInterval = setInterval(function(){ 
      Typer.pushData();
    }, 350);
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
    Typer.typedEntries += data.length;
    Typer.errors += data.errors;
    App.advanceGaddi(data)
  },

  calculateSpeed: function(){
    time = 0.005 + (Typer.counter * 0.005);//3 seconds
    Typer.grossWPM = (Typer.typedEntries / 5 ) / time;
    Typer.netWPM = Typer.grossWPM - ((Typer.errors/5) / time);
    Typer.accuracy = (Typer.netWPM / Typer.grossWPM) * 100;
    // console.log(Typer.grossWPM, Typer.netWPM, Typer.accuracy);
  },

  pushData: function(){
    var data = {id: 1, speed: Math.round(Typer.netWPM)};
    App.updateSpeed(data);
  }
}
Typer.init();
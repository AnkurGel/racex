var App = function() {
  function init() {
    App.stepFunction = 'word';
    typeEngine();
    Typer.init();
    createRoom();
  }
  
  //Privates
  function typeEngine() {
    var err;
    var lastIdxPosSuccess = 0; //special var to hold index after clearing input
    var userInputElmWrapper = $('#user-input');
    var userInputElm = userInputElmWrapper.find('input');
    
    //Para Splits
    var getPara = $('#sample-text').text().trim();
    var splitPara = getPara.split('');
    
    var errCounter = 0;
    
    userInputElm.on('input', function () {
      var userInput = $(this).val();
      var explodeUserInput = userInput.split('');
      var currentIdx = explodeUserInput.length - 1;
      
      //User Input Split
      var currentChar = explodeUserInput[currentIdx];
      
      if(splitPara[(lastIdxPosSuccess + currentIdx)] == ' ') {
        if($(this).parent().hasClass('dm')) {
          return;
        } else if($(this).val() != (getPara.substring(lastIdxPosSuccess, (lastIdxPosSuccess + currentIdx)) + ' ')) {
          userInputElmWrapper.removeClass('m').addClass('dm');
          return;
        }
        
        
        var completedText = getPara.substring(0, (lastIdxPosSuccess + currentIdx));
        var incompleteText = getPara.substring((lastIdxPosSuccess + currentIdx), $('#sample-text').text().trim().length);
        
        $('#sample-text').html('<span>' + completedText + '</span>' + incompleteText);
        // console.log(errCounter);
        // console.log($(this).val().length);
        // console.log($(this).val());
        var data = {
          errors: errCounter,
          length: $(this).val().length
        }
        
        Typer.sendKey(data);
        lastIdxPosSuccess = (lastIdxPosSuccess + currentIdx + 1);
        errCounter = 0; //reset errors
        $(this).val('');
      }
      
      if(currentChar == splitPara[(currentIdx + lastIdxPosSuccess)]) {
        userInputElmWrapper.removeClass('dm').addClass('m');
        if(App.stepFunction == 'char'){
          
        }
      } else {
        errCounter++;
        userInputElmWrapper.removeClass('m').addClass('dm');
      }
    });
  }
  

  function updateSpeed(data){
    $('.speed[data-user-id="'+data['id']+'"]').text(data['speed'] + ' WPM');
  }

  function createRoom() {
    $('#create-room').on('click', function() {
      $('.create-room-modal').removeClass('hide');
    });
    
    $('.create-room-wrapper').find('input[type=text]').on('keydown', function(e) {
      if(e.which == 13) {
        var getVal = $(this).val().trim();
        if(getVal == '') {
          return;
        }
        
        $.ajax({
          url: '/your-path',
          type: 'post',
          dataType: 'json',
          data: {
            room_name: $(this).val().trim()
          },
          success: function(res) {
            $('.create-room-modal').addClass('hide');
          },
          error: function() {
            
          }
        });
      }
    });
  }
  
  function advanceGaddi(data) {
    //shitty stuff
    var advanceUnit = (950 * data['length'] * 0.4 )/ $('#sample-text').text().trim().length;
    var track = 0;
    
    var left = $('.car[data-user-id=1]').css('left');
    $('.car[data-user-id=1]').css('left', (parseInt(left) + advanceUnit));
  }
  
  return {
    init: init,
    updateSpeed: updateSpeed,
    advanceGaddi: advanceGaddi
  }
}();

App.init();
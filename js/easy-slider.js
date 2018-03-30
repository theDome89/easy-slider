(function($) {
  const DIRECTION_PREV = 'prev';
  const DIRECTION_NEXT = 'next';

  // init the sliders with the given data attributes
  // data-interval-time is the time until the next slide appears if the autoscroll is active
  // if the data-big-image attribute is set, the slider will only show the image without any text in each slider
  // if the data-show-control attribute is set, the control panel to start and stop the autoscroll will be displayed
  $('[data-init-slider]').each(function(index, item){
    var self = $(item);
    new initSlider({
      data: self.attr('data-json-src'),
      elementId: 'slider' + index,
      intervalTime: self.attr('data-interval-time'),
      showControl: self.attr('data-show-control') !== undefined,
      bigImage: self.attr('data-big-image') !== undefined
    }, self);
  });

  function initSlider(options, $element) {
    // the slider cannot be initialized if there is no data-json-src set
    if(options.data === undefined) {
      return;
    }

    var controlPanel = '', controlAvailable = '', bigImage = '';

    // build the necessary html code to show the control panel, if it should be shown
    if(options.showControl === true && options.intervalTime !== undefined) {
      controlPanel = '<div class="control">' +
          '<div class="start" data-control-play data-selected alt="Start"></div>' +
          '<div class="stop" data-control-pause alt="Stop"></div>' +
      '</div>';
      controlAvailable = 'control-available';
    }

    // set the data-big-image attribute, if there should be no other content shown in the slides
    if(options.bigImage === true) {
      bigImage = 'data-big-image';
    }

    // append the basic html code for the slider to the DOM element
    $element.append(
        '<div class="content-container" ' + bigImage + '>' +
            '<div class="img-wrap" data-main-content-wrapper></div>' +
            '<div class="next" data-next-element alt="Next"></div>' +
            '<div class="prev" data-previous-element alt="Previous"></div>' +
        '</div>' +
        '<div class="preview">' +
            controlPanel +
            '<ul class="slideshow ' + controlAvailable + '" data-preview-container></ul>' +
        '</div>'
    );

    // set the generated slider id
    $element.attr('id', options.elementId);

    // get the JSON file and generate every single slide and append it to the DOM element
    $.getJSON(options.data, { 'date': new Date().getTime() }, function( datas ) {
    	$.each(datas, function(index, item) {
            var status = (index === 0) ? 'shown' : 'hidden',
            itemLabel = item.label || '',
            itemTitle = item.title || '',
            itemDetail = item.detail || '',
            itemArticle = item.article || '',
            itemImage = item.image || '',
            itemPreviewImage = item.previewImage || itemImage,
            itemButtonText = item.buttonText || '',
            itemContentHeader1 = (item.contentHeader1 !== undefined) ? '<h3>' + item.contentHeader1 + ': </h3>' : '',
            itemContentHeader2 = (item.contentHeader2 !== undefined) ? '<h3>' + item.contentHeader2 + ': </h3>' : '',
            itemContentHeader3 = (item.contentHeader3 !== undefined) ? '<h3>' + item.contentHeader3 + ': </h3>' : '',
            itemContent1 = (item.content1 !== undefined) ? '<span>' + item.content1 + ': </span>' : '',
            itemContent2 = (item.content2 !== undefined) ? '<span>' + item.content2 + ': </span>' : '',
            itemContent3 = (item.content3 !== undefined) ? '<span>' + item.content3 + ': </span>' : '';

        		$element.find('[data-main-content-wrapper]').append(
    		          '<div data-main-content="' + status + '">' +
                    '<span class="headline">' +
                          '<label class="black">' +
                             itemLabel +
                          '</label>' +
                          '<label>' +
                              itemDetail +
                          '</label>' +
                      '</span>' +
                      '<a href="' + itemArticle + '" data-element-link ' + bigImage +' class="left-img" target="_blank" onfocus="this.blur()">' +
                          '<img src="' + itemImage + '" title="' + itemDetail  + itemLabel  + '" />' +
                          '<div data-element-link class="whole-article" onfocus="this.blur()" target="_blank">' + itemButtonText + '</div>' +
                      '</a>'+
                      '<div class="content-text" ' + bigImage + '>' +
                          itemContentHeader1 + itemContent1 + itemContentHeader2 + itemContent2 + itemContentHeader3 + itemContent3 +
                      '</div>' +
                    '</div>'
    		     );

        // generate the preview slide and append it to the DOM element
    		$element.find('[data-preview-container]').append(
    		    '<li data-preview-element>' +
                '<a data-index="' + index + '" href="#" data-preview-element-link onfocus="this.blur()">' +
                    '<img width="auto" src="' + itemPreviewImage + '" alt="' + itemLabel + '" title="' + itemLabel + '" />' +
                    '<p data-preview-element-title>' +
                        itemLabel + ((itemTitle !== '')? ' | ' + itemTitle : '') +
                    '</p>' +
                '</a>'+
            '</li>'
        );
    	});
    })
    .success(function() {
      // init jScrollPane after building the html
      $element.find('[data-preview-container]').jScrollPane(
        {
          animateScroll: true
        }
      );
    })
    .fail(function() {
      // stop in case of a failure
      console.error('error');
      return;
    })
    .then(function() {
      // get the active slide and the id of the slider element itself
      var elementId = options.elementId,
          $selected = $($element.find('[data-main-content="shown"]'));

      // mark the selected element as selected in the slide container and the preview container
      $element.find('[data-preview-element]').eq($selected.index()).attr('data-selected', '');
      $element.find('[data-preview-element]').eq($selected.index()).find('[data-preview-element-title]').attr('data-selected', '');

      if(options.intervalTime !== undefined) {
          // start an interval with the given time to init autoscrolling
          var interval = setInterval(function() {
            $selected = getNext($element, $selected);
          }, options.intervalTime); // milliseconds
      }

      // init click events on the preview elements
      $('#' + elementId + ' [data-preview-element-link]').click(function () {
         if(options.intervalTime !== undefined) {
             // clear the interval to stop autoscrolling
             clearInterval(interval);
         }

         // get the selected element
         $selectedElement = $element.find('[data-main-content]').eq($(this).attr('data-index'));

         // mark the new element as selected
         $element.find('[data-preview-element-title]').removeAttr('data-selected');
         $(this).find('[data-preview-element-title]').attr('data-selected', '');
         $element.find('[data-preview-element]').removeAttr('data-selected');
         $(this).parent('[data-preview-element]').attr('data-selected', '');

         // show the slide of the new element
         $element.find('[data-main-content]').prependTo('[data-main-content-wrapper]').fadeOut(500).hide();
         $selectedElement.fadeIn(500).end().appendTo('[data-main-content-wrapper]');
         showNewContent($element, $selectedElement);
      });

      $('#' + elementId + ' [data-next-element]').click(function () {
          if(options.intervalTime !== undefined) {
              // clear the interval to stop autoscrolling
              clearInterval(interval);
          }

          // get the next element to show
          $selected = getNext($element, $selected);
      });

      $('#' + elementId + ' [data-previous-element]').click(function () {
          if(options.intervalTime !== undefined) {
              // clear the interval to stop autoscrolling
              clearInterval(interval);
          }

          // get the previous element to show
          $selected = getPrev($element, $selected);
      });

      // if there is no interval time set, we don't need to listen to these events
      if(options.intervalTime !== undefined) {
          $('#' + elementId + ' [data-control-play]').click(function () {
              // start an interval with the given time to init autoscrolling
              var interval = setInterval(function() {
                $selected = getNext($element, $selected);
              }, options.intervalTime); // milliseconds

              // mark the play button as selected and the pause button as unselected
              $element.find('[data-control-pause]').removeAttr('data-selected');
              $(this).attr('data-selected', '');
          });

          $('#' + elementId + ' [data-control-pause]').click(function () {
              // clear the interval to stop autoscrolling
              clearInterval(interval);

              // mark the pause button as selected and the play button as unselected
              $element.find('[data-control-play]').removeAttr('data-selected');
              $(this).attr('data-selected', '');
          });

          $('#' + elementId + ' [data-element-link]').click(function () {
              // clear the interval to stop autoscrolling
              clearInterval(interval);
          });

          $(window).blur(function() {
              // clear the interval to stop autoscrolling
              clearInterval(interval);
          });
      }

      $(window).resize( function() {
          // reinit jScrollPane in case of a window resizing
          $('[data-preview-container]').jScrollPane(
              {
                  animateScroll: true
              }
          );
      });
    });
  };

  function getNextElement($element, $selectedElement) {
    // returns the next element to show
    return ($selectedElement.next().length > 0) ? $selectedElement.next() : $element.find('[data-main-content]').first();
  };

  function getPreviousElement($element, $selectedElement) {
    // returns the previous element to show
    return ($selectedElement.prev().length > 0) ? $selectedElement.prev() : $element.find('[data-main-content]').last();
  }

  function getNextPreviewElement($element, $selectedElement, direction) {
    // find and get the current shown element in the preview container
    var $currentPreview = $element.find('[data-preview-element]').eq($selectedElement.index());

    // depending on the direction get the next element in the preview container
    if(direction === DIRECTION_PREV) {
        // if there is no previous element, get the last one
        // otherwise get the previous one
        if(!$currentPreview.prev().length){
        	  return $element.find('[data-preview-element]').last();
        }else{
            return $currentPreview.prev();
        }
    }

    // if there is no further element, get the first one
    if(!$currentPreview.next().length){
        return $element.find('[data-preview-element]').eq(0);
    }

    // otherwise get the next element
    return $currentPreview.next();
  };

  function setStyling($element, $selectedElement, $targetElement, $currentPreview, direction) {
    // mark the selected element in the content container and in the preview container as selected
    $element.find('[data-preview-element-title]').removeAttr('data-selected');
    $currentPreview.find('[data-preview-element-title]').attr('data-selected', '');
    $element.find('[data-preview-element]').removeAttr('data-selected');
    $currentPreview.attr('data-selected', '');
    var $previewContainer = $element.find('[data-preview-container]');

    // do the scrolling to the new selected element depending on the direction
    switch(direction){
      case DIRECTION_NEXT:
        if($targetElement.index() === 0){
          $previewContainer.animate({ scrollLeft: 0 }, 'slow'); //without jScrollPane
          $previewContainer.data('jsp').scrollBy((-110 * ($selectedElement.index() + 1)) , 0); //with jScrollPane
        }else{
          $previewContainer.animate({ scrollLeft: (110 * ($selectedElement.index() + 1)) }, 'slow'); //without jScrollPane
          $previewContainer.data('jsp').scrollBy(110 , 0); //with jScrollPane
        }
        break;
      case DIRECTION_PREV:
        if($selectedElement.index() === 0){
          $previewContainer.animate({ scrollLeft: (110 * ($targetElement.index() + 1)) }, 'slow'); //without jScrollPane
          $previewContainer.data('jsp').scrollBy((110 * ($targetElement.index() + 1)) , 0); //with jScrollPane
        }else{
          $previewContainer.animate({ scrollLeft: (110 * ($targetElement.index())) }, 'slow'); //without jScrollPane
          $previewContainer.data('jsp').scrollBy(-110 , 0); //with jScrollPane
        }
        break;
    }
  };

  function getNext($element, $selectedElement) {
      // get the next element to show
      var $next = getNextElement($element, $selectedElement);

      // set the styling
      setStyling($element, $selectedElement, $next, getNextPreviewElement($element, $selectedElement, DIRECTION_NEXT), DIRECTION_NEXT);


      transition($element, $selectedElement, $next);

      return $next;
  };

  function getPrev($element, $selectedElement) {
      // get the previous element to show
      var $previous = getPreviousElement($element, $selectedElement);

      // set the styling
      setStyling($element, $selectedElement, $previous, getNextPreviewElement($element, $selectedElement, DIRECTION_PREV), DIRECTION_PREV);

      // do the transition
      transition($element, $selectedElement, $previous);

      return $previous;
  };

  function showNewContent($element, $next) {
      // show the next element in the content container
      $element.find('[data-main-content]').attr('data-main-content', 'hidden');
      $next.attr('data-main-content', 'shown');
  };

  function transition($element, $selectedElement, $target) {
      // show the next element in the content container
      showNewContent($element, $target);

      // animate the scrolling
      $selectedElement.fadeOut('fast').hide().css('z-index', 0);
      $target.css('z-index', 2).fadeIn('slow', function () {
        $target.css('z-index', 1);
      });
  };
})(jQuery);

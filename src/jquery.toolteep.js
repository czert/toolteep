(function($) {
    var defaults = {
        'position': 'top',
        'max-width': 500,
        'speed': 200
    };

    var Toolteep = function(options, element) {
        this.options = $.extend({}, defaults, options);
        this.element = element;
        this.$element = $(element);
        this._init();
    };


    Toolteep.prototype = {

        $tip: null,

        /**
         * @private
         */
        _init: function() {
            // set up opening/closing
            this.$element.hover($.proxy(this.open, this), $.proxy(this.close, this));

            // create the tooltip from the element's title attribute
            this.$tip = $('<div class="toolteep"></div>');
            this.$tip.append($('<p class="toolteep-text">' + this.$element.attr('title') + '</p>'));
            this.$element.removeAttr('title');

            // append the caret elements
            this.$tip.append('<span class="toolteep-before"/>');
            this.$tip.append('<span class="toolteep-after"/>');

            // TODO (czert) we should be more careful about this:
            $('body').css('position', 'relative');

            // update options using the data attribute
            var options = this.$element.data('toolteep');
            if (options)
                $.extend(this.options, options);

            // prepare resize/scroll handler
            this._check_handler = $.proxy(this.check, this);
        },


        /**
         * @public
         */
        option: function(key, value) {
            if ($.isPlainObject(key))
                this.options = $.extend(true, this.options, key);
            else if (key && typeof value === "undefined")
                return this.options[key];
            else
                this.options[key] = value;
            return this;
        },


        open: function() {
            this.$tip.appendTo('body').fadeIn(this.options.speed);

            // apply proper positioning
            this.check();

            // check positioning on every resize/scroll
            // TODO (czert) this should be throttled, at least optionally
            $(document).on('scroll', this._check_handler);
            $(window).on('resize', this._check_handler);
        },


        close: function() {
            this.$tip.fadeOut(this.options.speed, $.proxy(function() {
                this.$tip.detach();
                // teardown event handlers
                $(document).off('scroll', this._check_handler);
                $(window).off('resize', this._check_handler);
            }, this));
        },


        check: function() {
            // try the default positioning
            this._position(this.options.position);

            // first, center horizontally
            var amount = (this.$tip.outerWidth() - this.$element.outerWidth()) / 2;
            this.$tip.css('margin-left', -1 * amount);

            // get metrics
            var metrics = this._measure();

            var window_top = $(window).scrollTop();
            var window_left = $(window).scrollLeft();
            var window_bottom = window_top + $(window).height();
            var window_right = window_left + $(window).width();

            // first, vertical checks
            if (metrics.offset.top < window_top) {
                this._position('bottom');
            } else if (metrics.offset.top + metrics.height > window_bottom) {
                this._position('top');
            }

            // next, horizontal checks
            var dt = 0;
            if (metrics.offset.left < window_left) {
                dt = metrics.offset.left - window_left;
            } else if (metrics.offset.left + metrics.width > window_right) {
                dt = metrics.offset.left + metrics.width - window_right;
            }
            this.$tip.css('margin-left', -1 * (amount + dt));

            // center the caret
            this.$tip.find('.toolteep-after, .toolteep-before')
                .css('left', dt + this.$tip.outerWidth() / 2);
        },


        _position: function(position, dx) {
            // position the tooltip as requested

            // $element coords
            var el_top = this.$element.offset().top;
            var el_left = this.$element.offset().left;
            var el_bottom_from_top = el_top + this.$element.outerHeight();
            var el_top_from_bottom = $(document).height() - el_top;

            // generic styling
            this.$tip.css({
                'position': 'absolute',
                'max-width': this.options['max-width'],
                'top': 'auto',    // clear any previous positioning
                'bottom': 'auto', // dtto
                'left': el_left
            });

            // position as requested
            if (position === 'top') {
                this.$tip.css('bottom', el_top_from_bottom);
                this.$tip.find('.toolteep-after, .toolteep-before')
                    .addClass('bottom').removeClass('top');
            } else {
                this.$tip.css('top', el_bottom_from_top)
                this.$tip.find('.toolteep-after, .toolteep-before')
                    .removeClass('bottom').addClass('top');
            }
        },


        _measure: function() {
            // return $tip metrics
            $e = this.$tip;
            return {
                'width': $e.outerWidth(),
                'height': $e.outerHeight(),
                'offset': $e.offset()
            };
        }
    };


    // plug into jQuery
    $.widget.bridge("toolteep", Toolteep);


    // init by data attributes
    $(document).on('ready', function() {
        $('[data-toolteep]').toolteep();
    });
})(jQuery);

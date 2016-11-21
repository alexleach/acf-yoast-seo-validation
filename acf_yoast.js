/**
 *
 * Add live SEO Validation to Yoast SEO while having custom ACF Fields.
 * Works also with Flexible Content and Repeater Fields.
 * https://github.com/dachcom-digital/acf-yoast-seo-validation.git
 *
 * Include this Javascript ONLY in BackEnd.
 *
 * @author: DACHCOM.DIGITAL | Stefan Hagspiel <shagspiel@dachcom.ch>
 * @version: 1.1.0
 *
 * All rights reserved.
 *
 */
var acfPlugin;
(function ($) {


    var AcfPlugin = function () {
        this.content = {};
        this.pluginName = 'acfPlugin';
    };

    $.fn.reverse = Array.prototype.reverse;

    /**
     * Set's the field content to use in the analysis
     *
     * @param {Object} $el The current element that was added or modified, as a
     * jQuery object
     */
    AcfPlugin.prototype.setContent = function ($el) {

        var key = $el.attr('data-field_key'),
            type = $el.attr('data-field_type'),
            value = null;

        switch (type) {
            case 'text' :
                value = $el.find('input').val();
                if ($el.is("[class*='wrap-in-']")) {
                    var wrapMatch = $el.attr('class').match(/wrap-in-(\w+)/);
                    value = '<' + wrapMatch[1] + '>' + value + "</" + wrapMatch[1] + ">";
                }
                break;
            case 'image' :
                value = $el.find("img[src!='']").prop('outerHTML');
                break;
            case 'gallery' :
                value = '';
                $el.find("div.thumbnail > img").each(function () {
                    value += $(this).prop('outerHTML');
                });
                break;
            case 'textarea' :
            case 'wysiwyg' :
                value = $el.find('textarea').val();
                break;
            default :
                value = null;
        }

        var $parents = $el.parents('[data-field_name][data-field_type][data-field_key],tr.row');

        if (value !== null) {
          var parentContent = this.content;
          if ($parents.length > 0) {
            // loop through the parents, in reverse order (top-level elements first)
            var ind = $el.closest('tr.row').index();
            $parents.get().reverse().forEach(function(element) {
              var $parent = $(element);
              // parent is either a row/layout (get the id) or a field (get the key)
              var id = $parent.is('tr.row') ? ind : $parent.attr('data-field_key');
              if (parentContent[id] === undefined) {
                parentContent[id] = {};
              }
              parentContent = parentContent[id];
            });
          }
          parentContent[key] = value;
          YoastSEO.app.pluginReloaded(this.pluginName);
        }
        return true;
    };

    /**
     * Delete an ACF-element: remove the element data from the content and update
     * Yoast.
     * @param {type} $el The removed element, either a repeater row or a layout
     */
    AcfPlugin.prototype.removeContent = function($el) {

      if ($el.parents('.row-clone').length > 0) {
        return; // adding an element triggers remove on the clone, ignore this
      }
      var $parents = $el.parents('[data-field_name][data-field_type][data-field_key],tr.row');
      var parentContent = this.content;
      if ($parents.length > 0) {
        // loop through the parents, in reverse order (top-level elements first)
        $parents.reverse().each(function() {
          var $parent = $(this);
          // parent is either a row/layout (get the id) or a field (get the key)
          var id = $parent.is('tr.row') ? ind : $parent.attr('data-field_key');
          parentContent = parentContent[id];
          if (parentContent === undefined) {
            return false;
          }
        });
      }
      if (parentContent !== undefined) {
        var key = $el.attr('data-field_key');
        if (typeof key !== typeof undefined && key !== false) {
          delete parentContent[key];
          YoastSEO.app.pluginReloaded(this.pluginName);
        }
      }
    };

    /**
     * Registers plugin to YoastSEO
     */
    AcfPlugin.prototype.registerPlugin = function () {
        YoastSEO.app.registerPlugin(this.pluginName, {status: 'ready'});
    };

    /**
     * Registers modifications to YoastSEO
     */
    AcfPlugin.prototype.registerModifications = function () {
        YoastSEO.app.registerModification('content', this.addAcfDataToContent.bind(this), this.pluginName, 10);
    };

    /**
     * Adds ACF Data to content
     *
     * @param {String} yoastContent The page content, to be passed to Yoast
     * @returns {String} The page content with added extra field contents
     */
    AcfPlugin.prototype.addAcfDataToContent = function (yoastContent) {
        if ($.isEmptyObject(this.content)) {
          return yoastContent;
        }
        $.each(this.content, function (key, value) {
          yoastContent = addSubContent(yoastContent, value);
        });
        return yoastContent;
    };

    function addSubContent(yoastContent, subContent) {
      if (typeof subContent === 'object') { // repeater or layout
        $.each(subContent, function(containerKey, containerValue) {
          yoastContent = addSubContent(yoastContent, containerValue);
        });
      } else {
        yoastContent += subContent + '\n';
      }
      return yoastContent;
    }

    acfPlugin = new AcfPlugin();
    var boundSetContent = acfPlugin.setContent.bind(acfPlugin);

    $(window).on('YoastSEO:ready', function () {
      acfPlugin.registerPlugin();
      acfPlugin.registerModifications();
    });


    $(document).on('acf/setup_fields', function(e, div){
      // Find ACF fields for Yoast
      $(div).find('.acf_postbox').not('.acf-hidden').find('.field').each(function(){

        var $el = $(this).closest('[data-field_name][data-field_type][data-field_key]');

        if ($el.parents('.row-clone').length > 0) {
          return;
        }

        boundSetContent($el);

        // Attach wysiwyg onChange event to update Yoast content.
        var type = $el.attr('data-field_type');
        if (type == 'wysiwyg' || type == 'textarea') {
          $el.find('textarea').change(function() {
            boundSetContent($el);
          })
        }
      });
    });

    $(document).on('acf/remove_fields', function(e, div){
      $(div).find('.acf_postbox').not('.acf-hidden').each(function(){
        boundSetContent($(this));
      });
    });

}(jQuery));
/* vim: set sw=2 sts=2 ts=2 */

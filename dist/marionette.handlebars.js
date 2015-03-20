// Marionette.Handlebars, v0.1.0
// Copyright (c)2015 Michael Heim, Zeilenwechsel.de
// Distributed under MIT license
// http://github.com/hashchange/marionette.handlebars

;( function( Backbone, _, Handlebars ) {
    "use strict";

    var origLoadTemplate;

    if ( ! Backbone.Marionette ) throw new Error( "Load error: Backbone.Marionette is not available" );

    origLoadTemplate = Backbone.Marionette.TemplateCache.prototype.loadTemplate;

    _.extend( Backbone.Marionette.TemplateCache.prototype, {

        /**
         * Loads and returns a template from the Handlebars cache, the DOM, or the server (if set up to do so). Throws
         * an error if the template can't be found.
         *
         * Unlike the original Marionette implementation, this version of loadTemplate does not always return the raw
         * template HTML. If the template is fetched from the Handlebars cache of precompiled templates, it is returned
         * as is, ie as a compiled template function.
         *
         * That does not cause issues in Marionette.TemplateCache, as long as the compileTemplate function can handle it
         * correctly. (And here, it obviously does.)
         *
         * If a template can't be found in either the Handlebars cache or the DOM, the job is passed on to the
         * lazyLoadTemplate() method. It is a noop by default. To use an actual loader and make it work for your needs,
         * assign your own implementation to Backbone.Marionette.TemplateCache.prototype.lazyLoadTemplate.
         *
         * @param   {string}           templateId  a selector, usually, or the file ID if the Handlebars cache is used
         * @param   {Object|undefined} options
         * @returns {string|Function}
         */
        loadTemplate: function ( templateId, options ) {
            var templateHtml,
                precompiledTemplate = getPrecompiledTemplate( templateId );

            if ( ! precompiledTemplate || ! _.isFunction( precompiledTemplate ) ) {
                try {
                    templateHtml = origLoadTemplate.call( this, templateId, options );
                } catch ( err ) {}

                if ( ! isValidTemplateHtml( templateHtml ) ) templateHtml = this.lazyLoadTemplate( templateId, options );

                // Throw an error if the template is missing, just like the original implementation.
                if ( ! isValidTemplateHtml( templateHtml ) ) this.throwTemplateError( templateId );
            }

            return templateHtml || precompiledTemplate;
        },

        /**
         * Returns the compiled template.
         *
         * Unlike the original Marionette implementation, the method does not just accept a raw template HTML string as
         * its first argument, but an existing precompiled template as well. Such a template function is simply returned
         * as it is.
         *
         * @param   {string|Function}  template
         * @param   {Object|undefined} options
         * @returns {Function}
         */
        compileTemplate: function ( template, options ) {
            return _.isFunction( template ) ? template : Handlebars.compile( template, options );
        },

        /**
         * Lazy-load the template.
         *
         * Noop by default. Provide your own loader by implementing this method. It must return the templateHtml if
         * successful, or undefined otherwise. And it MUST NOT be async (set async: false in an $.ajax() call).
         *
         * @param   {string}           templateId
         * @param   {Object|undefined} options
         * @returns {string|undefined}
         */
        lazyLoadTemplate: function ( templateId, options ) {
            return undefined;
        },

        /**
         * Throws a NoTemplateError in a way which is compatible with any Marionette version.
         *
         * @param {string} templateId
         */
        throwTemplateError: function ( templateId ) {

            var errType = 'NoTemplateError',
                errMsg = 'Could not find template: "' + templateId + '"';

            if ( Backbone.Marionette.Error ) {
                // Error handling in Marionette 2.x
                throw new Backbone.Marionette.Error( { name: errType, message: errMsg } );
            } else if ( typeof throwError === "function" ) {
                // Error handling in Marionette 1.x
                throwError( errMsg, errType );                                              // jshint ignore:line
            } else {
                // Being future proof, we throw our own errors if all else has failed
                throw new Error( errMsg );
            }

        }

    } );

    /**
     * Returns the precompiled Handlebars template for a given template ID, if it exists.
     *
     * NB In this case, the template ID is not a selector, but derived from the file name of the original template.
     * See http://handlebarsjs.com/precompilation.html
     *
     * @param   {string} templateId
     * @returns {Function|undefined}
     */
    function getPrecompiledTemplate ( templateId ) {
        return Handlebars.templates && Handlebars.templates[ templateId ];
    }

    /**
     * Checks if the template data is a non-empty string.
     *
     * @param   {*} templateData
     * @returns {boolean}
     */
    function isValidTemplateHtml ( templateData ) {
        return _.isString( templateData ) && templateData.length > 0;
    }

}( Backbone, _, Handlebars ));
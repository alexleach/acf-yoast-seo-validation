<?php
/*
Plugin Name: Dachcom ACF - YOAST SEO Validation
Plugin URI: https://github.com/dachcom-digital/acf-yoast-seo-validation.git
Description: Add a YOAST SEO (3+) Validation to ACF.
Version: 5.3.2.2
Author: Stefan Hagspiel
Author URI: http://www.dachcom.com
Copyright: DACHCOM.DIGITAL, Stefan Hagspiel
*/


Class AcfYoastSeoValidator {

  public function __construct() {
    if (defined('WPSEO_VERSION')) {
      $min = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

      wp_enqueue_script('acf_yoast_seo_validator',
        plugin_dir_url( __FILE__ ) . "acf_yoast{$min}.js",
        array('acf-input'), false, true);
    }
  }
}

add_action( 'admin_enqueue_scripts', 'acf_yoast_init' );
function acf_yoast_init ($hook) {
  if (in_array($hook, array('post.php', 'post-new.php' ))) {
    new AcfYoastSeoValidator();
  }
}


if(typeof(extensions) == 'undefined')
  extensions = {};

if(typeof(extensions.navPlugins) == 'undefined' && typeof(extensions.nav) != 'undefined')
{
  extensions.navPlugins = function()
  {
	window.removeEventListener('load', extensions.navPlugins, false);
	
	//register the actions of the menuitem to allow other add-ons extend the menus
	
	extensions.nav.registerPlugin('open_os', 'Open with OS', function(aPath){ extensions.nav.launch(aPath) });
	extensions.nav.registerPlugin('open_komodo', 'Open in a new tab', function(aPath){ extensions.nav.openURL(aPath, true) });
	extensions.nav.registerPlugin('find', 'Find...', function(aPath)
										  {
											ko.launch.findInFiles.apply(ko.launch, ['', aPath]);
										  }
								  );
	
	/*
		extensions.nav.registerPlugin(
									  'the_name_of_my_action',
									  'the_label_of_my_action',
										function(aSelectedPath){
										  extensions.myExt.myFunction(aSelectedPath)
										}
									);

	*/
  }
  
  window.addEventListener('load', extensions.navPlugins, false);
  
}



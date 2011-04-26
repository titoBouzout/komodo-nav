Experimental folder browsing and bookmarks.. and several tweaks to places toolbar.

<img src="http://dl.dropbox.com/u/9303546/komodo/nav/screenshot.png" style="float:rigth"/>

<blockquote>
From a places toolbarbutton this add-on allows bookmark the active tab or the selected files on "Places".
Builds a menu with these bookmarks allowing real-time navigation of directories and files.

With simply click the directories will open on "Places" sidebar. On files will open these files in a new tab.
Each file and folder contains a context menu with options ( open with OS, bookmark folder, Find.. )
</blockquote><br/>

The context menu is extensible, you can add new functions (menuitems) by calling to :
<code>
extensions.nav.registerPlugin('the_unique_name_of_my_action', 'My Action..', function(aPath)
												{
												  alert('do something with:'+aPath);
												  //do something with aPath..
												}
							  );
</code>

Feature:

<blockquote>
This feature comes from an idea originally developed for <a href="https://addons.mozilla.org/en-US/firefox/addon/176740/">ODP Extension</a>.
</blockquote><br/>

License:<br/>
GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007

Todo:<br/>
http://github.com/titoBouzout/Nav/raw/master/todo.txt

Know Bugs:<br/>
Can't browse servers.

Icons Art:<br/>
http://p.yusukekamiyamane.com/

Source-Code:<br/>
http://github.com/titoBouzout/Nav

All versions Changes:<br/>
http://github.com/titoBouzout/Nav/raw/master/changes.html

Current Version Changes:

<ul><!-- root node -->

  
  <li>
	0.110426.2 - http://community.activestate.com/files/nav_1.xpi
	<ul>
	  <li>Fix:
		<ul>
		  <li>Take paths as is from the system. ( you may need to rebookmark your current bookmarks.)</li>
		</ul>
	  <li>Improves:
		<ul>
		  <li>Fix bug : http://bugs.activestate.com/show_bug.cgi?id=87887
		  <li>Fix bug : http://bugs.activestate.com/show_bug.cgi?id=88141
		  <li>Fix bug : http://bugs.activestate.com/show_bug.cgi?id=88443
		  <li>Change how the plugins are registered. There is no need to write XUL ( look into plugins.js )
		  <li>Reoder the buttons in the toolbar
		  <li>Adds "Bookmark selected files" and "Execute with OS" to places context menu.
		  <li>Adds "Find.." to "nav" context menu as a new plugin.
		  <li>Adds a button to quickly open a folder to the toolbar.
		  <li>Adds "Open File" to tab context menu in order to open a file that is relative to the tab. (This helps when the tab that was clicked is not focused)
		  <li>Adds "Save all" to tab context menu.
		</ul>
	</ul>
  </li>
  
  <li>
	0.110414.1 - http://community.activestate.com/files/nav_0.xpi
	<ul>
	  <li>Adds button to "go up one directory"</li>
	  <li>Adds button to refresh places sidebar</li>
	</ul>
	0.101101.0 - http://community.activestate.com/files/nav.xpi
	<ul>
	  <li>First Release</li>
	</ul>
  </li>

</ul><!-- end root node -->


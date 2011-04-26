
if(typeof(extensions) == 'undefined')
  extensions = {};

if(typeof(extensions.nav) == 'undefined')
{
  //most of the code here comes from ODP Extension
  //"category browser" and "category navigator" feature
  
  extensions.nav = function()
  {
	  //removes the listener, sets the first bookmarks
	  this.init = function()
	  {
		this.rootButton = false;
		
		removeEventListener('load', extensions.nav.init, false);
		//new line caracter detection
		var osVersion = String(Components.classes["@mozilla.org/xre/app-info;1"]
										.getService(Components.interfaces.nsIXULRuntime).OS).toLowerCase();
		//NOTE: The new line separator should be used only when copying things to the clipboard or when contructing HTML for the user.
		//Internal new lines should be \n
		if(osVersion.indexOf('mac') != -1 || osVersion.indexOf('darwin') != -1  || osVersion.indexOf('leopard') !=-1 )
		{
			this.__NEW_LINE__ = '\r';
			this.__DIRECTORY_SEPARATOR__ = '/';
		}			
		else if(osVersion.indexOf('win') != -1)
		{
			this.__NEW_LINE__ = '\r\n';
			this.__DIRECTORY_SEPARATOR__ = '\\';
		}
		else
		{
			this.__NEW_LINE__ = '\n';
			this.__DIRECTORY_SEPARATOR__ = '/';
		}
		//reorde places toolbar
		var placesToolbar = this.getBrowserElement('placesToolbar');
			placesToolbar.insertBefore(this.getBrowserElement('placesOpenDirectory'), placesToolbar.firstChild);
			placesToolbar.insertBefore(this.getBrowserElement('placesGoUpButton'), placesToolbar.firstChild);
			placesToolbar.insertBefore(this.getBrowserElement('placesForwardButton'), placesToolbar.firstChild);
			placesToolbar.insertBefore(this.getBrowserElement('placesBackButton'), placesToolbar.firstChild);
			//move parent directories menu to go up one directory menu
			this.getBrowserElement('placesGoUpButton').appendChild(this.getBrowserElement('placesParentDirectoriesMenu'));
			//move nav menu to rootButton
			this.getBrowserElement('placesRootButton').appendChild(this.getElement('menupopup'))
			//fix bug http://bugs.activestate.com/show_bug.cgi?id=87887
			this.getBrowserElement('placesRootButton').setAttribute('crop', "right");
			this.getBrowserElement('placesRootButton').setAttribute('flex', "1");
			this.getBrowserElement('placesRootButton').setAttribute('pack', "start");
			//remove the spacer as the toolbarbutton rootbutton already is flex.
			var childNodes = placesToolbar.childNodes;
			for(var i=0;i<childNodes.length;i++)
			{
			  if(childNodes[i].tagName == 'spacer')
			  {
				placesToolbar.removeChild(childNodes[i]);
				break;
			  }
			}
			
	  }
	  //every time the popup is opened the menupopup is filled
	  //every time the popup is closed the popup is emptied
	  this.onPopupShowing = function(aEvent)
	  {
		//if this is the root menu build the menu
		if(aEvent.originalTarget != aEvent.currentTarget)
		  return;
		
		//append bookmarked folders and files
		
		  var anElement = this.getElement('bookmarks');
		  
		  //empties the menu
		  this.removeChilds(anElement.parentNode);
		
		  //read the file with the data
		  var aFileData = this.extensionDirectory()+'nav.bookmarks.json';
		  if(!this.fileExists(aFileData))
			this.fileWrite(aFileData, '[]');
			
		  var bookmarks = JSON.parse(this.fileRead(aFileData));
			  bookmarks = bookmarks.sort(this.sortLocale);
			  bookmarks.reverse();
		  
		  for(var id in bookmarks)
		  {
			if(bookmarks[id] != '')
			  this.appendItem(bookmarks[id], anElement, false);
		  }
		  
		//list drives ( Windows only )
		
		  try
		  {
			var root = Components.classes["@mozilla.org/file/local;1"].  
						  createInstance(Components.interfaces.nsILocalFile);  
			root.initWithPath("\\\\.");

			var drivesEnum = root.directoryEntries, drives = [];  
			while (drivesEnum.hasMoreElements())
			{  
			  drives[drives.length] = drivesEnum.getNext()
										.QueryInterface(Components.interfaces.nsILocalFile).path
			}
		  }
		  catch(e)
		  {
			var drives = [];
		  }
		  
		  var anElement = this.getElement('drives');
		  
		  if(drives.length > 0)
		  {
			drives.sort(this.sortLocale).reverse()
			anElement.setAttribute('hidden', false);
			for(var id in drives)
			  this.appendItem(drives[id], anElement, false);
		  }
		  else
		  {
			anElement.setAttribute('hidden', true);
		  }
	  }
	  
	  //empty the popup to clean memory
	  this.onPopupHidden = function(aEvent)
	  {
		//if this is the root menu
		if(aEvent.originalTarget != aEvent.currentTarget)
		  return;
		this.removeChilds(this.getElement('menupopup'))
	  }
	  
	  //appends categories to root menu
	  this.appendItem = function(aURL, aPreviousNode, aTemporalNode)
	  {
		var add = this.create("menuitem");
			add.setAttribute("label", this.categoryAbbreviate(aURL).replace(/\\/g, '/'));
			add.setAttribute("value", aURL);
			add.setAttribute("crop", 'start');
			if(this.fileIsFolder(aURL))
			  add.setAttribute("class", 'menuitem-iconic nav-d');
			else
			{
			  add.setAttribute("class", 'menuitem-iconic nav-f');
			  add.setAttribute("done", 'true');
			  add.setAttribute("ext", aURL.split('.').pop().toLowerCase());
			}

			if(aTemporalNode)
			  add.setAttribute("temporal", true);
			  
		this.moveNodeBelow(add, aPreviousNode);
	  }
	  //replaces a menuitem that is equivalent to a category,
	  //for a menu with the category as label and as childs the subcategories
	  this.browserNavigate = function(aEvent)
	  {
		  var item = aEvent.originalTarget;//the hovered menuitem
		  
		  var tagName = this.tagName(item);
		  
		  if(
			 (tagName == 'xul:menu' || tagName == 'menu' || tagName == 'menuitem') &&  item.hasAttribute('value'))
		  {
			  if(aEvent.type == 'mouseover')
				  item.setAttribute('isFocused', true);
			  else if(aEvent.type == 'mouseout')
				  item.removeAttribute('isFocused');
  
			  if(!item.hasAttribute('done'))
			  {
				 //this.commandOutput('browserNavigate')
				  if(aEvent.type == 'mouseover' && !item.hasAttribute('retrieving'))
				  {
					  item.setAttribute('retrieving', true);
					  var aCategory =  item.getAttribute('value');
						  item.interval = setTimeout(function(){extensions.nav.browserNavigateRequestCategories(item);}, 190);
				  }
				  else if(aEvent.type == 'mouseout')
				  {
					  clearTimeout(item.interval);
					  item.removeAttribute('retrieving');
				  }
			  }
		  }
		  return true;
	  }
	  //obtains the categories to build the navegables menus
	  this.browserNavigateRequestCategories = function(item)
	  {
		//this.commandOutput('browserNavigateRequestCategories')

		item.setAttribute('done', true);
		item.removeAttribute('retrieving');

		var aResult = this.folderListContent(item.getAttribute('value'));
		
		if(aResult.length < 1 )
		{
			if(this.fileIsFolder(item.getAttribute('value')))
			{
			  item.setAttribute('label', item.getAttribute('label')+'/');
			  item.setAttribute('class', 'menuitem-iconic nav-d');
			}
			else
			{
			  item.setAttribute('class', 'menuitem-iconic nav-f');
			  item.setAttribute("ext", item.getAttribute('label').split('.').pop().toLowerCase());
			}
		}
		else
		{
		  this.browserNavigateBuildSubMenu(item, aResult);
		}
	  }

	//build the XUL for the menu that is currently browseable
	this.browserNavigateBuildSubMenu = function(item, aCategories)
	{
			//normal menu
			var menu = this.create('menu');
				menu.setAttribute('label', item.getAttribute('label'));
				menu.setAttribute('value', item.getAttribute('value'));
				menu.setAttribute('done', 'true');
				menu.setAttribute('class', 'menu-iconic nav-d');
				menu.setAttribute("crop", 'start');
				//menu.setAttribute('context', 'nav-context-menu');
				
			var menupopup = this.create('menupopup');
				//menupopup.setAttribute('ignorekeys', true);

			var aCategoryLastChildName;
			//adding the categories
				for(var id in aCategories)
				{
					aCategoryLastChildName = this.categoryGetLastChildName(aCategories[id]);
					  var add = this.create("menuitem");
						  add.setAttribute("label", aCategoryLastChildName);
						  add.setAttribute("value", aCategories[id]);
						  if(this.fileIsFolder(aCategories[id]))
							add.setAttribute('class', 'menuitem-iconic nav-d');
						  else
						  {
							add.setAttribute('done', 'true');
							add.setAttribute('class', 'menuitem-iconic nav-f');
							add.setAttribute("ext", aCategories[id].split('.').pop().toLowerCase());
						  }

					  menupopup.appendChild(add);
				}
				menu.appendChild(menupopup);
			
			//parents menu
			if(this.subStrCount(item.getAttribute('value'), this.__DIRECTORY_SEPARATOR__) > 0)
			{
				var menuParents = this.create('menu');
					menuParents.setAttribute('label', 'Parents');
					menuParents.setAttribute('style', 'font-weight:bold;');
					menuParents.setAttribute('done', 'true');
					menuParents.setAttribute('class', 'menu-iconic');
					//menuParents.setAttribute('context', 'nav-context-menu');

				var menupopupParents = this.create('menupopup');
					menupopupParents.setAttribute('class', 'menupopup-iconic');
					//menupopupParents.setAttribute('ignorekeys', true);

				var aNodes = item.getAttribute('value').split(this.__DIRECTORY_SEPARATOR__);
				var path = '';
				for(var id in aNodes)
				{
					if(id==aNodes.length-1)
						break;
					path += aNodes[id];
					var add = this.create('menuitem');
						add.setAttribute('value', path);
						add.setAttribute('label', path.replace(/\\/g, '/'));
						add.setAttribute('class', 'nav-d menuitem-iconic');
						add.setAttribute('crop', 'center');
						menupopupParents.appendChild(add);
					
					path+=this.__DIRECTORY_SEPARATOR__;
				}
				menuParents.appendChild(menupopupParents);
				menupopup.appendChild(this.create('menuseparator'));
				menupopup.appendChild(menuParents);
			}

			//appending the menus
			if(item && item.hasAttribute('isFocused'))
			{
				if(item && item.parentNode)
				{
					if(item.hasAttribute('id'))
					{
						menu.setAttribute('id', item.getAttribute('id'));
						menu.setAttribute('style', item.getAttribute('style'));
					}
					if(item.hasAttribute('temporal'))
						menu.setAttribute('temporal', item.getAttribute('temporal'));

					try
					{
						item.parentNode.replaceChild(menu, item);
					}
					catch(e)
					{
						item.appendChild(menupopup);
					}
					menupopup.openPopup(menu, 'end_before');
				}
			}
			else
			{
				if(item && item.parentNode)
				{
					if(item.hasAttribute('id'))
					{
						menu.setAttribute('id', item.getAttribute('id'));
						menu.setAttribute('style', item.getAttribute('style'));
					}
					if(item.hasAttribute('temporal'))
						menu.setAttribute('temporal', item.getAttribute('temporal'));
					try
					{
					  item.parentNode.replaceChild(menu, item);
					}
					catch(e)
					{
					  item.appendChild(menupopup);
					}
				}
			}
	}

	//handle the clicks on the category browser
	this.browserClick = function(aEvent)
	{
		//this.commandOutput('categoryBrowserClick');
		
		var item = aEvent.originalTarget;
		
		if(!item.hasAttribute('value'))
		{
			//don't show the context menu if there is no category selected
			if(aEvent.button == 2)
				this.stopEvent(aEvent);
			  
			if(item.hasAttribute('action'))
			{
			  //hide the popup
			  this.getElement('menupopup').hidePopup();
			  var action = item.getAttribute('action');
			  
			  if(action == 'bookmark_active_tab')
				this.bookmarkAdd(this.filePathFromFileURI(this.documentFocusedGetLocation()));
			  else if(action == 'bookmark_selected_files')
			  {
				var paths = this.getSelectedPaths();
				for(var id in paths)
				{
				  this.bookmarkAdd(paths[id]);
				}
			  }
			  else if(action == 'bookmark_places')
			  {
				this.bookmarkAdd(this.filePathFromFileURI(this.getPlacesPath()));
			  }
			  else if(action == 'bookmark_folder')
			  {
				var d = ko.filepicker.getFolder(null, "Pick the directory to bookmark")
				if(!d){}
				else
				{
				  this.bookmarkAdd(this.filePathFromFileURI(d));
				}
			  }
			  else if(action == 'bookmark_files')
			  {
				var d = ko.filepicker.browseForFiles(null, "Pick the files to bookmark")
				for(var id in d)
				  this.bookmarkAdd(this.filePathFromFileURI(d[id]));
			  }
			}
		}
		//the contextual menu will open
		else if(aEvent.button == 2)
		{
			this.stopEvent(aEvent);
			this.selectedItem = item;
			this.getElement('context-menu').hidePopup();
			this.getElement('context-menu').openPopup(null, "", aEvent.clientX, aEvent.clientY, true, false);
			
		}
		//deafult action is open folder or file
		else if(aEvent.button == 0 || (!aEvent.button && aEvent.type == 'command'))
		{		
			//when a "menu" is clicked the popup don't close it self
			aEvent.currentTarget.hidePopup();
			this.openURL(item.getAttribute('value'), true);
		}
		else if(aEvent.button == 1)
		{
			this.folderOpen(item.getAttribute('value'));
			//if the click is on the toolbar this will fail because is not a popup
			try{aEvent.currentTarget.hidePopup();}catch(e){/*shhhh*/}
		}
		else//just in case 
		{
			this.stopEvent(aEvent);
		}
	}
	this.openSelectedFilesWithOS = function()
	{
	  var paths = this.getSelectedPaths();
	  for(var id in paths)
		this.launch(paths[id]);
	}
	this.bookmarkSelectedFiles = function()
	{
	  var paths = this.getSelectedPaths();
	  for(var id in paths)
		this.bookmarkAdd(paths[id]);
	}
	this.registerPlugin = function(anAction, aLabel, aFunction)
	{
	  if(!this.plugins)
		this.plugins = [];
		
	  var aPlugin = document.createElement('menuitem');
		  aPlugin.setAttribute('action', anAction);
		  aPlugin.setAttribute('label', aLabel);
	  this.getElement('context-menu').insertBefore(aPlugin, this.getElement('context-menu').firstChild);
	  
	  this.plugins[anAction] = aFunction;
	}
	//hides or show relevant menuitems
	this.contextPopupShowing = function(aEvent)
	{
	  //if the root menu was right clicked
	  if(this.selectedItem &&
		(
			this.selectedItem.parentNode == this.getElement('menupopup') ||
			this.selectedItem.parentNode.parentNode == this.getElement('menupopup') 
		)
	  )
	  {
		var childNodes = aEvent.currentTarget.childNodes;
		for(var i=0;i<childNodes.length;i++)
		{
		  var item = childNodes[i];
		  if(item.hasAttribute('action'))
		  {
			if(
			   item.getAttribute('action') == 'bookmark_add' || 
			   item.getAttribute('action') == 'bookmark_add_open'
			)
			{
			  item.setAttribute('disabled', true);
			}
			else
			{
			  item.setAttribute('disabled', false);
			}
		  }
		}
	  }
	  else
	  {
		var childNodes = aEvent.originalTarget.childNodes;
		for(var i=0;i<childNodes.length;i++)
		{
		  var item = childNodes[i];
		  if(item.hasAttribute('action'))
		  {
			if(item.getAttribute('action') == 'bookmark_delete')
			{
			  item.setAttribute('disabled', true);
			}
			else
			{
			  item.setAttribute('disabled', false);
			}
		  }
		}
	  }
	}
	this.contextPopupClick = function(aEvent)
	{
	  var anAction = aEvent.originalTarget.getAttribute('action');
	  var aPath = this.selectedItem.getAttribute('value');
	  
	  if(this.plugins && this.plugins[anAction])
	  {
		try{this.plugins[anAction](aPath);}catch(e){}
	  }
	  else
	  {
		switch(anAction)
		{
		  case 'bookmark_add':
			{
			  this.bookmarkAdd(aPath);
			  break;
			}
		  case 'bookmark_add_open':
			{
			  this.bookmarkAdd(aPath);
			  this.openURL(aPath, true);
			  break;
			}
		  case 'bookmark_delete':
			{
			  this.bookmarkDelete(aPath)
			  break;
			}
		}
	  }
	}
	this.bookmarkAdd = function(aPath)
	{
	  var file = Components
				.classes["@activestate.com/koFileEx;1"]
				.createInstance(Components.interfaces.koIFileEx);
	  file.path = aPath;
	  
	  if(file.isLocal && aPath.indexOf('macro') !== 0 &&  aPath.indexOf('chrome') !== 0 )
	  {
		var aFileData = this.extensionDirectory()+'nav.bookmarks.json';
		if(!this.fileExists(aFileData))
		  this.fileWrite(aFileData, '[]');
  
		var bookmarks = JSON.parse(this.fileRead(aFileData));
			  bookmarks[bookmarks.length] = aPath;

			bookmarks = this.arrayUnique(bookmarks);
			bookmarks = bookmarks.sort(this.sortLocale);
			this.fileWrite(aFileData, JSON.stringify(bookmarks));
	  }
	}
	this.bookmarkDelete = function(aPath)
	{
	  var aFileData = this.extensionDirectory()+'nav.bookmarks.json';
	  if(!this.fileExists(aFileData))
		this.fileWrite(aFileData, '[]');
		
	  var bookmarks = JSON.parse(this.fileRead(aFileData));
		  for(var id in bookmarks)
		  {
			if(aPath == bookmarks[id])
			{
			  delete bookmarks[id];
			  break;
			}
		  }
		  bookmarks = this.arrayUnique(bookmarks);
		  
		  this.fileWrite(aFileData, JSON.stringify(bookmarks));
		
		this.getElement('menupopup').hidePopup();
		this.getElement('menupopup').openPopup(this.getBrowserElement('placesRootButton'), 'after_start');
	}
	
	

/* UTILS */


	
	//reveals a folder on File Manager
	this.folderOpen = function(aFilePath)
	{
		var aFile = Components.classes["@mozilla.org/file/local;1"]
					  .createInstance(Components.interfaces.nsILocalFile);	
			aFile.initWithPath(aFilePath);
		try 
		{
			aFile.reveal();
		}
		catch (e)
		{
		}
	}
	//open an URI with an external handlers- mailto: for example, reveal, etc
	this.launch = function(aURL)
	{
		if(this.fileIsFolder(aURL))
		{
		  this.folderOpen(aURL);
		}
		else
		{
		  var aFile = Components.classes["@mozilla.org/file/local;1"].  
						  createInstance(Components.interfaces.nsILocalFile); 
		  aFile.initWithPath(aURL);
		  aFile.launch();
		}
	}
	
	//stopPropagation and preventDefault
	this.stopEvent = function (event)
	{
		event.stopPropagation();
		event.preventDefault();
	}

	//returns an array with the of all the files in a folder
	this.folderListContent = function(aFolderPath)
	{
	  try
	  {
		var aDirectory = Components.classes["@mozilla.org/file/local;1"].  
							createInstance(Components.interfaces.nsILocalFile); 
		
			aDirectory.initWithPath(aFolderPath);
		if(aDirectory.isDirectory())
		{
		  var folderContent = [], folderContentD = [], folderContentF = [], entry, dirList = [], aName, entries = aDirectory.directoryEntries;
		  
		  while(entries.hasMoreElements())
		  {
			  entry = entries.getNext();
					  entry.QueryInterface(Components.interfaces.nsIFile);
			  var path = entry.path;//windowses
			  if(entry.isDirectory())
				folderContentD[folderContentD.length] = path;
			  else
				folderContentF[folderContentF.length] = path;
		  }
		  folderContentD.sort(this.sortLocale);
		  folderContentF.sort(this.sortLocale);
		  for(var id in folderContentD)
			folderContent[folderContent.length] = folderContentD[id];
		  for(var id in folderContentF)
			folderContent[folderContent.length] = folderContentF[id];
		  return folderContent;
		}
		else
		{
		  return [];
		}
	  }
	  catch(e)
	  {
		return [];
	  }
	}
	//returns the extension directory
	this.extensionDirectory = function()
	{
		var extensionDirectory = Components.classes["@mozilla.org/file/directory_service;1"]  
			  .getService(Components.interfaces.nsIProperties)  
			  .get("ProfD", Components.interfaces.nsIFile);
			  return extensionDirectory.path+this.__DIRECTORY_SEPARATOR__;
	}
	//returns the category name for the last child of a category
	this.categoryGetLastChildName = function(aCategory)
	{
	  aCategory = aCategory.split(this.__DIRECTORY_SEPARATOR__).join('/');
		return aCategory.replace(/\/+$/, '').replace(/.*\/([^\/]+)$/, "$1");
	}
	  this.categoryAbbreviate = function(aURL)
	  {
		aURL = aURL.split(this.__DIRECTORY_SEPARATOR__).join('/');
		if(this.subStrCount(aURL, '/') > 5)
		  return aURL.replace(/\/+$/, '').replace(/.*\/([^\/]+\/[^\/]+\/[^\/]+\/[^\/]+)$/, "…$1");
		else
		  return aURL;
	  }
	//Count the number of substring occurrences
	this.subStrCount = function(aString, aStringToCount)
	{
		var a = 0;
		var pos = aString.indexOf(aStringToCount);
		while(pos != -1) 
		{
		   a++;
		   pos = aString.indexOf(aStringToCount, pos+1);
		}
		return a;
	}
	  //gets an element from this extension
	  this.getElement = function(aElement)
	  {
		return document.getElementById('nav-'+aElement);
	  }
	  this.getBrowserElement = function(aElement)
	  {
		return document.getElementById(aElement);
	  }
	  //returns a new element
	  this.create = function (elementName)
	  {
		  return document.createElement(elementName);
	  }
	  //moves aNode below aTargetNode
	  this.moveNodeBelow = function (aNode, aTargetNode)
	  {
		  try
		  {
			  aTargetNode.parentNode.insertBefore(aNode, aTargetNode.nextSibling);
		  }
		  catch(e)
		  {
			  aTargetNode.parentNode.insertBefore(aNode, aTargetNode.previousSibling);
		  }
	  }
	  //returns the tag name of a node in lower case
	  this.tagName = function (aNode)
	  {
		  if(aNode && aNode.tagName)
		  {
			  var copy = aNode.tagName;
			  return String(copy).toLowerCase();
		  }
		  else
			  return '';
	  }

	  //removes all non locked childs from a node
	  this.removeChilds = function (anElement)
	  {
		  if(anElement.hasChildNodes())
		  {
			  var deletion = []
			  var length = anElement.childNodes.length;
			  for(var a=0;a<length;a++)
			  {
				  if(!anElement.childNodes[a].hasAttribute('locked'))
					  deletion[deletion.length] = anElement.childNodes[a];
			  }
			  for(var id in deletion)
				  anElement.removeChild(deletion[id]);
		  }
	  }
	  //detects when the user right click the placesRootButton
	  this.placesPopupShown = function(event)
	  {
		if(event.currentTarget == event.originalTarget)
		{
		  if(ko.places.manager._clickedOnRoot())
			this.rootButton = true;
		  else
			this.rootButton = false;
		}
		return true;
	  }
	  
	  //returns selected URIs
		//from focused document (if the event comes from the toolbarbutton ) or
		//from focused files and/or folders of the places sidebar
		//places root folder if no selection on the places sidebar
		//places root folder if right click on "placesRootButton"
		//asumes places files unless useFocusedTab
	  this.getSelectedPaths = function(useFocusedTab)
	  {
		if(!useFocusedTab)
		{
			var selected = gPlacesViewMgr.getSelectedURIs();
  
			if(!this.rootButton && selected && selected.length && selected.length > 0)
			{
			  for(var id in selected)
				selected[id] = this.filePathFromFileURI(selected[id]);
			}
			else
			{
			  selected = [];
			  selected[0] =  this.filePathFromFileURI(this.getPlacesPath());
			}
		}
		else
		{
		  var selected = [];
			  selected[0] =  this.filePathFromFileURI(this.documentFocusedGetLocation());	
		}
		return selected;
	  }
	  this.getPlacesPath = function()
	  {
		  if(ko.places && ko.places.manager && ko.places.manager.currentPlace &&  ko.places.manager.currentPlace != '')
			return String(ko.places.manager.currentPlace);
		  else
			return '';
	  }
	  this.getSelectedPathFolder = function(event)
	  {
		var selected = this.getSelectedPaths(event)[0];
		  if(this.fileIsFolder(selected)){}
		  else
			  selected = this.fileDirname(selected);
		return selected;
	  }
  
	  this.openURL = function(aFilePath, newTab)
	  {
		if(this.fileIsFolder(aFilePath))//folders
		{
		  ko.places.manager.openDirURI(this.decodeUTF8(this.fileURIFromPath(aFilePath)));
		}
		else
		{
		  if(newTab)
			ko.open.multipleURIs([aFilePath]);
		}
	  }
	this.decodeUTF8 = function(aString)
	{
		if(aString.indexOf('%') == -1)
			return aString;
		try
		{
			return decodeURIComponent(aString);
		}
		catch(e)
		{
			try
			{
				return decodeURI(aString);
			}
			catch(e)
			{
				return aString;
			}
		}
	};
	  this.documentFocusedGetLocation = function()
	  {
		return this.documentGetLocation(this.documentGetFocused());
	  }
	  this.documentGetFocused = function()
	  {
		var aDoc = this.documentGetFromTab(this.tabGetFocused());
		if(aDoc)
		  return aDoc;
		else
		  this.error('no document focused');
	  }
	  this.documentGetLocation = function(aDocument)
	  {
		if(aDocument.displayPath)
		  return aDocument.displayPath;
		else
		  this.error('document has no location');
	  }
	  this.documentGetFromTab = function(aTab)
	  {
		if(aTab.document)
		  return aTab.document;
		else
		  this.error('tab has no document');
	  }
	  this.tabGetFocused = function()
	  {
		if(ko.views.manager.currentView)
		  return ko.views.manager.currentView;
		else
		  this.error('no tab focused');
	  }
	  //outputs text to the command output window
	  //http://community.activestate.com/faq/how-do-you-write-command-output-window
	  this.commandOutput = function(aString)
	  {
		  // First make sure the command output window is visible
		  ko.run.output.show(window, false);
		  // Second, make sure we're showing the output pane, not the error list pane.
		  var deckWidget = document.getElementById("runoutput-deck");
		  if (deckWidget.getAttribute("selectedIndex") != 0) {
			  ko.run.output.toggleView();
		  }
		  // Now find out which newline sequence the window uses, and write the
		  // text to it.
		  var scimoz = document.getElementById("runoutput-scintilla").scimoz;
		  var prevLength = scimoz.length;
		  var currNL = ["\r\n", "\n", "\r"][scimoz.eOLMode];
		  var full_str = aString + currNL;
		  var full_str_byte_length = ko.stringutils.bytelength(full_str);
		  var ro = scimoz.readOnly;
		  try {
			  scimoz.readOnly = false;
			  scimoz.appendText(full_str_byte_length, full_str);
		  } finally {
			  scimoz.readOnly = ro;
		  }
		  // Bring the new text into view.
		  scimoz.gotoPos(prevLength + 1);
	  }
	  //cast an object toString avoids null errors
	  this.string = function(aString)
	  {
		  if(!aString)
			  return '';
		  else
			  return aString.toString();
	  }
	  //returns true if a file exists
	  this.fileExists = function(aFilePath)
	  {
		try
		{
		  var aFile = Components.classes["@mozilla.org/file/local;1"]
						  .createInstance(Components.interfaces.nsILocalFile);
			  aFile.initWithPath(aFilePath);
  
			  if(aFile.exists())
				  return true;
			  else
				  return false;
		}
		catch(e)
		{
		  return false;
		}
	  }
	  //returns true if a path is a folder
	  this.fileIsFolder = function(aFilePath)
	  {
		try{
		  var aFile = Components.classes["@mozilla.org/file/local;1"]
						  .createInstance(Components.interfaces.nsILocalFile);
			  aFile.initWithPath(aFilePath);
  
			  if(aFile.exists() && aFile.isDirectory())
				  return true;
			  else
				  return false;
		}catch(e)
		{
		  return false;
		}
	  }
	  //returns the content of a file
	  this.fileRead = function(aFilePath)
	  {
		  var aFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);	
			  aFile.initWithPath(aFilePath);
  
		  var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
			  converter.charset = "UTF-8"; /* The character encoding you want, using UTF-8 here */
  
		  var is = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance( Components.interfaces.nsIFileInputStream );
			  is.init(aFile, 0x01, 0444, 0); 
		  
		  var sis = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
			  sis.init(is);
			  
		  var aData = converter.ConvertToUnicode(sis.read(sis.available()));
		  
		  is.close();
		  sis.close();
		  
		  return aData;
	  }
	  //writes content to a file
	  this.fileWrite = function(aFilePath, aData)
	  {
		  try
		  {
		  //write the content to the file
			  var aFile = Components.classes["@mozilla.org/file/local;1"]
							  .createInstance(Components.interfaces.nsILocalFile);
				  aFile.initWithPath(aFilePath);
	  
			  var WriteStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
			  // use 0x02 | 0x10 to open file for appending.
			  //WriteStream.init(aFile, 0x02 | 0x08 | 0x20, 0644, 0); // write, create, truncatefile,  
			  WriteStream.init(aFile, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncatefile,  
								  
			  var why_not_a_simple_fopen_fwrite = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
			  
			  why_not_a_simple_fopen_fwrite.init(WriteStream, "utf-8", 0, 0xFFFD); // U+FFFD = replacement character
			  why_not_a_simple_fopen_fwrite.writeString(aData);
			  
			  why_not_a_simple_fopen_fwrite.close();
			  WriteStream.close();
			  var path = aFile.path;
			  
			  return path;
		  }
		  catch(e)
		  {
			  this.error('Can\'t write to the file "'+aFilePath+'"\nBrowser says: '+e);
		  }
	  }
	  //returns the dirname of a file
	  this.fileDirname = function(aFilePath)
	  {
		  var aDestination = Components.classes["@mozilla.org/file/local;1"]
						  .createInstance(Components.interfaces.nsILocalFile);
			  aDestination.initWithPath(aFilePath);
  
		  var dirname =  aDestination.parent.path;
		  return dirname;
	  }
	  //returns a file path from a file URI
	  this.filePathFromFileURI = function(aURI)
	  {
		try{
		if(!this.ios)
		  this.ios = Components.classes["@mozilla.org/network/io-service;1"].  
						  getService(Components.interfaces.nsIIOService);
  
		return String(this.ios.newURI(aURI, null, null)
					.QueryInterface(Components.interfaces.nsIFileURL).file.path);
		}
		catch(e)
		{
		  return aURI;
		}
	  }
	  //returns a file path from a file URI
	  this.fileURIFromPath = function(aPath)
	  {
		if(!this.ios)
		  this.ios = Components.classes["@mozilla.org/network/io-service;1"].  
						  getService(Components.interfaces.nsIIOService);
						  
		  var file = Components.classes["@mozilla.org/file/local;1"].  
						createInstance(Components.interfaces.nsILocalFile);  
			  file.initWithPath(aPath);
		  
		return this.ios.newFileURI(file).asciiSpec;
	  }
	  
	  //removes duplicate values from an array
	  this.arrayUnique = function (anArray)
	  {
		  var tmp = [];
		  for(var id in anArray)
		  {
			  if(!this.inArray(tmp, anArray[id]))
			  {
				  tmp[tmp.length] = anArray[id];
			  }
		  }
		  return tmp;
	  }
	  //checks if a value exists in an array
	  this.inArray = function (anArray, some)
	  {
		  for(var id in anArray)
		  {
			  if(anArray[id]==some)
				  return true;
		  }
		  return false;
	  }
	  this.sortLocale = function(a, b)
	  {
		  return a.localeCompare(b);
	  }

	  return this;
	
  }();
  	  
  window.addEventListener('load', extensions.nav.init, false);

} //end if extensions.nav == undefined


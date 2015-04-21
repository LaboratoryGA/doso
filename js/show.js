/* 
 * Copyright (C) 2015 Nathan Crause <nathan at crause.name>
 *
 * This file is part of DOSO
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */

(function() {
	// make sure we've been invoked after doso_args have been defined
	if (!window["doso_args"]) {
		document.write("Missing required object 'doso_args'");
		return;
	}
	
	// make sure we have all the required arguments
	var required = ["id", "folder_id"];
	for (var i in required) {
		if (!doso_args[required[i]]) {
			document.write("Missing require attribute 'doso_args." + required[i] + "'");
			return;
		}
	}
	
	// push in some defaults
	var defaults = {
		list_template: "doso/icon_list.html",
		item_template: "doso/icons.tmpl.html"
	};
	for (var i in defaults) {
		if (!doso_args[i]) {
			doso_args[i] = defaults[i];
		}
	}
	
	// make a localized copy of the args now, so that during asynchronous
	// I/O, we don't wipe out our own arguments.
	var my_args = $.extend({}, doso_args);
	
	// make sure we don't have a pre-existing DOSO instance with the same name
	if ($("#" + my_args.id).size()) {
		document.write("Duplicate 'my_args.id': " + my_args.id);
		return;
	}

	// generate a placeholder in-line
	document.write("<div id=\"" + my_args.id + "-container\"></div>");

	jQuery(function($) {
		var stagesCompleted = 0;
		
		// get list template
		$.post("/intranet/doso/get_part.php", {
				id: my_args.id, 
				template: my_args.list_template}, function(data) {
			$("#" + my_args.id + "-container").append(data);
			
			++stagesCompleted;
		});
		
		$.post("/intranet/doso/get_part.php", {
				id: my_args.id + "-item", 
				template: my_args.item_template}, function(data) {
			window[my_args.id + "_item_template"] = _.template(data);
			
			++stagesCompleted;
		});
		
		// wait until all the stages are complete
		var thread = setInterval(function() {
			if (stagesCompleted == 2 && window[my_args.id + "_item_template"]) {
				clearInterval(thread);
				window[my_args.id + "_stack"] = [];
				populateDOSO(my_args.id, my_args.folder_id, my_args.folder_id);
			}
		}, 500);
	});
})();

if (!window["populateDOSO"]) {
	/**
	 * Populates a DOSO list with files
	 * 
	 * @param {String} id the unique ID of the DOSo instance
	 * @param {int} parentFolderID the internal ID number of the folder
	 * immediately above the current one
	 * @param {int} currentFolderID the intenral ID number of the current folder
	 * being browsed
	 * @returns {undefined}
	 */
	populateDOSO = function(id, parentFolderID, currentFolderID) {
		var container = $("#" + id);
		
		container.empty();
		
//		console.log("Stack:");
//		console.log(window[doso_args.id + "_stack"]);

		$.getJSON("/intranet/rest/documents/folder/" + currentFolderID, function(data) {
			// if the parent folder is parentFolderID != currentFolderID,
			// add a hacky "back" item
			if (parentFolderID != currentFolderID && window[doso_args.id + "_stack"]) {
				data.unshift({
					id: parentFolderID,
					type: "folder",
					title: ".."
				});
			}
			
			$.each(data, function(key, val) {
				val.url = val.type == "folder" 
						? "#list/" + val.id
						: val.parent_id + "/" + val.doc_id;
				// try to guess the icon
				val.icon = (function() {
					if (val.type == "folder") return "folder";
					
					if (val.title.match(/\.pdf$/i)) return "doc-pdf";
					if (val.title.match(/\.(?:xls)|(?:xlsx)$/i)) return "doc-excel-table";
					if (val.title.match(/\.(?:doc)|(?:docx)$/i)) return "doc-office";
					if (val.title.match(/\.(?:avi)|(?:mpg)|(?:mpeg)|(?:mp4)$/i)) return "doc-film";
					if (val.title.match(/\.(?:png)|(?:jpg)|(?:gif)$/i)) return "image1";
					
					return "page";
				})();
				
				container.append(window[id + "_item_template"](val));
			});
			
			// reset all folders to instead invoke populateDOSO
			$("[data-type='folder']", container).click(function(event) {
				event.preventDefault();
				var targetFolder = $(this).data("doc-id");
				
				// if the target folder is the same as the last one on the
				// stack, then we're a reversal (step back)
				var last = window[doso_args.id + "_stack"].pop();
				var targetParent = "";
				
				if (last == targetFolder) {
					targetParent = window[doso_args.id + "_stack"].pop();
					
					if (targetParent) {
						window[doso_args.id + "_stack"].push(targetParent);
					}
					else {
						targetParent = targetFolder;
					}
				}
				else {
					targetParent = currentFolderID;
					if (last) {
						window[doso_args.id + "_stack"].push(last);
					}
					window[doso_args.id + "_stack"].push(currentFolderID);
				}
				
				populateDOSO(id, targetParent, targetFolder);
			});
		});
	}
}
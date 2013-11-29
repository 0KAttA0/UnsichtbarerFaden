//define a global application
var App = angular.module('App', []);

//create an app router for url management and redirect
App.config(function($routeProvider) {
	$routeProvider.when('/frontpage', {
		templateUrl : 'partials/frontpage.html',
		controller : 'frontpage',
	});
	$routeProvider.when('/articleoverview', {
		templateUrl : 'partials/article_overview.html',
		controller : 'articleoverview',
	});
	$routeProvider.when('/newarticle', {
		templateUrl : 'partials/new_article.html',
		controller : 'newarticle',
	});
	$routeProvider.when('/nodeeditor', {
		templateUrl : 'partials/nodeeditor.html',
		controller : 'newarticle',
	});
	$routeProvider.otherwise({
		redirectTo : '/frontpage'
	});
});

/********** CONTROLLER *************/
//backend frontpage controller
App.controller('frontpage', function($scope) {
	console.log('Hello from the Frontpage Controller');
	$scope.name = 'Nutzer';
});

//backend articel overview controller
App.controller('articleoverview', function($scope) {
	console.log('Hello from the Article overview Controller');
});

//backend new articel controller
App.controller('newarticle', function($scope) {
	console.log('Hello from the newarticle Controller');
});

App.controller('nodeditor', function($scope) {
	console.log('Hello from the node editor Controller');
});


/********* FUNCTIONS *****************/

App.articleList = function($scope, $http) {
	//Testarticles
	$scope.articles = $http.get('/get/articles')
	.then(function(result) {
         //resolve the promise as the data
         return result.data;
     });
};

App.saveNodes = function($scope, $http) {
	alert("save nodes");
	console.log("save");
	
};

App.initNodes = function($scope, $http) {
	
	$scope.nodes = null;
	
	
	//save nodes
	$scope.saveNodes = function() {

		var data = $scope.nodes;
		console.log("send data", data);
		$http.post('/set/nodes', data)
		.success(function(data, status, headers, config){
			console.log("Nodes saved!");
			alert("Gespeichert!");
		}).error(function(data, status, headers, config){
			alert("I can't do this, Dave!");
		});
	};

	$scope.relations = $http.get('/get/nodes').then(function(result) {
		 $scope.nodes = result.data;
         $scope.nodes.deletedNodes = Array();
         
      // set up SVG for D3
         var width  = jQuery('#grapheditor').width(),
             height = jQuery('#grapheditor').height(),
             colors = d3.scale.category10();

         var svg = d3.select('#grapheditor')
           .append('svg')
           .attr('width', width)
           .attr('height', height);

         // set up initial nodes and links
         //  - nodes are known by 'id', not by index in array.
         //  - reflexive edges are indicated on the node (as a bold black circle).
         //  - links are always source < target; edge directions are set by 'left' and 'right'.
         var nodes = result.data.nodes;
         var lastNodeId = 0;
         for(var i = 0; i < nodes.length; i++)
        	 if( nodes[i].id > lastNodeId )
        		 lastNodeId = nodes[i].id;
         var links = [];
         for(var i = 0; i < result.data.links.length; i++){
        	 var link = result.data.links[i];
        	 var src = null;
        	 var dst = null;
        	 
        	 for(var j = 0; j < nodes.length; j++){
        		 if( nodes[j].id == link.source )
        			 src = nodes[j];
        		 if( nodes[j].id == link.target )
        			 dst = nodes[j];
        		 if(src != null && dst != null)
        			 break;
        	 }
        	 
        	 if(src != null && dst != null)
        		 links.push({source: src, target: dst, left: false, right: true});
         }
         result.data.links = links;
         
         // init D3 force layout
         var force = d3.layout.force()
             .nodes(nodes)
             .links(links)
             .size([width, height])
             .linkDistance(150)
             .charge(-500)
             .on('tick', tick);

         // line displayed when dragging new nodes
         var drag_line = svg.append('svg:path')
           .attr('class', 'link dragline hidden')
           .attr('d', 'M0,0L0,0');

         // handles to link and node element groups
         var path = svg.append('svg:g').selectAll('path'),
             circle = svg.append('svg:g').selectAll('g');

         // mouse event vars
         var selected_node = null,
             selected_link = null,
             mousedown_link = null,
             mousedown_node = null,
             mouseup_node = null;
         
         function nodeExists(name){
             for(var i=0; i<nodes.length; i++){
          	   if(nodes[i].name == name){
          		   return true;
          	   }
             }
             
             return false;
         }

         function resetMouseVars() {
           mousedown_node = null;
           mouseup_node = null;
           mousedown_link = null;
         }

         // update force layout (called automatically each iteration)
         function tick() {
           // draw directed edges with proper padding from node centers
           path.attr('d', function(d) {
             var deltaX = d.target.x - d.source.x,
                 deltaY = d.target.y - d.source.y,
                 dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                 normX = deltaX / dist,
                 normY = deltaY / dist,
                 sourcePadding = d.left ? 17 : 12,
                 targetPadding = d.right ? 17 : 12,
                 sourceX = d.source.x + (sourcePadding * normX),
                 sourceY = d.source.y + (sourcePadding * normY),
                 targetX = d.target.x - (targetPadding * normX),
                 targetY = d.target.y - (targetPadding * normY);
             return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
           });

           circle.attr('transform', function(d) {
             return 'translate(' + d.x + ',' + d.y + ')';
           });
         }

         // update graph (called when needed)
         function restart() {
           // path (link) group
           path = path.data(links);

           // update existing links
           path.classed('selected', function(d) { return d === selected_link; })
             .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
             .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });


           // add new links
           path.enter().append('svg:path')
             .attr('class', 'link')
             .classed('selected', function(d) { return d === selected_link; })
             .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
             .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
             .on('mousedown', function(d) {
               if(d3.event.ctrlKey) return;

               // select link
               mousedown_link = d;
               if(mousedown_link === selected_link) selected_link = null;
               else selected_link = mousedown_link;
               selected_node = null;
               restart();
             });

           // remove old links
           path.exit().remove();


           // circle (node) group
           // NB: the function arg is crucial here! nodes are known by id, not by index!
           circle = circle.data(nodes, function(d) { return d.id; });

           // update existing nodes (reflexive & selected visual states)
           circle.selectAll('circle')
             .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
             
             
           // add new nodes
           var g = circle.enter().append('svg:g');

           g.append('svg:circle')
             .attr('class', 'node')
             .attr('r', 15)
             .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
             .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
             .classed('reflexive', function(d) { return d.reflexive; })
             .on('mouseover', function(d) {
               if(!mousedown_node || d === mousedown_node) return;
               // enlarge target node
               d3.select(this).attr('transform', 'scale(1.1)');
             })
             .on('mouseout', function(d) {
               if(!mousedown_node || d === mousedown_node) return;
               // unenlarge target node
               d3.select(this).attr('transform', '');
             })
             .on('mousedown', function(d) {
               if(d3.event.ctrlKey) return;

               // select node
               mousedown_node = d;
               if(mousedown_node === selected_node) selected_node = null;
               else selected_node = mousedown_node;
               selected_link = null;

               // reposition drag line
               drag_line
                 .style('marker-end', 'url(#end-arrow)')
                 .classed('hidden', false)
                 .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

               restart();
             })
             .on('mouseup', function(d) {
               if(!mousedown_node) return;

               // needed by FF
               drag_line
                 .classed('hidden', true)
                 .style('marker-end', '');

               // check for drag-to-self
               mouseup_node = d;
               if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

               // unenlarge target node
               d3.select(this).attr('transform', '');

               // add link to graph (update if exists)
               // NB: links are strictly source < target; arrows separately specified by booleans
               var source, target, direction;
               if(mousedown_node.id < mouseup_node.id) {
                 source = mousedown_node;
                 target = mouseup_node;
                 direction = 'right';
               } else {
                 source = mouseup_node;
                 target = mousedown_node;
                 direction = 'left';
               }

               var link;
               link = links.filter(function(l) {
                 return (l.source === source && l.target === target);
               })[0];

               if(link) {
                 link[direction] = true;
               } else {
                 link = {source: source, target: target, left: false, right: false};
                 link[direction] = true;
                 links.push(link);
               }

               // select new link
               selected_link = link;
               selected_node = null;
               restart();
             });

           // show node IDs
           //console.log("append text", g);
           circle.selectAll('text').remove();
           circle.append('text')
               .attr('x', 0)
               .attr('y', 4)
               .attr('class', 'id')
               .text(function(d) { return d.name; });
           
           //resize circles by textsize
           var c = 0;
           circle.selectAll("text").each(function () {
        	   //console.log(circle.selectAll("circle"));
        	   circle.selectAll("circle")[c++][0].setAttribute('r', this.getComputedTextLength()/2+2);
           });
           
           // remove old nodes
           circle.exit().remove();

           // set the graph in motion
           force.start();
         }

         function mousedown() {
           // prevent I-bar on drag
           //d3.event.preventDefault();
           
           // because :active only works in WebKit?
           svg.classed('active', true);
           
           if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

           // insert new node at point
           var name = prompt("Name","Neuer Knoten");
           if(name == '' || name == null)
        	   return;
           if(nodeExists(name)){
        	   alert("Name existiert bereits!");
    		   return;
           }
           
           var point = d3.mouse(this),
               node = {id: ++lastNodeId, reflexive: false, name: name};
           node.x = point[0];
           node.y = point[1];
           nodes.push(node);
           console.log("Node", nodes);

           restart();
         }

         function mousemove() {
           if(!mousedown_node) return;

           // update drag line
           drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

           restart();
         }

         function mouseup() {
           if(mousedown_node) {
             // hide drag line
             drag_line
               .classed('hidden', true)
               .style('marker-end', '');
           }

           // because :active only works in WebKit?
           svg.classed('active', false);

           // clear mouse event vars
           resetMouseVars();
         }

         function spliceLinksForNode(node) {
           var toSplice = links.filter(function(l) {
             return (l.source === node || l.target === node);
           });
           toSplice.map(function(l) {
             links.splice(links.indexOf(l), 1);
           });
         }

         // only respond once per keydown
         var lastKeyDown = -1;

         function keydown() {
//           d3.event.preventDefault();

           if(lastKeyDown !== -1) return;
           lastKeyDown = d3.event.keyCode;

           // ctrl
           if(d3.event.keyCode === 17) {
             circle.call(force.drag);
             svg.classed('ctrl', true);
           }

           if(!selected_node && !selected_link) return;
           switch(d3.event.keyCode) {
             case 8: // backspace
             case 46: // delete
               if(selected_node) {
            	   $scope.nodes.deletedNodes.push(selected_node);
                 nodes.splice(nodes.indexOf(selected_node), 1);
                 spliceLinksForNode(selected_node);
               } else if(selected_link) {
                 links.splice(links.indexOf(selected_link), 1);
               }
               selected_link = null;
               selected_node = null;
               restart();
               d3.event.preventDefault();
               break;
             case 82: // rename
               if(selected_node) {
                 // toggle node reflexivity
            	 var name = prompt("Neuer Name", selected_node.name);
            	 if(name != '' && name != null && !nodeExists(name)){
            		 selected_node.name = name;
            		 //console.log(name);
            		 console.log("nodes", nodes);
            		 restart();
            	 }
               }
               d3.event.preventDefault();
               break;
           }
         }

         function keyup() {
           lastKeyDown = -1;

           // ctrl
           if(d3.event.keyCode === 17) {
             circle
               .on('mousedown.drag', null)
               .on('touchstart.drag', null);
             svg.classed('ctrl', false);
           }
         }

         // app starts here
         svg.on('mousedown', mousedown)
           .on('mousemove', mousemove)
           .on('mouseup', mouseup);
         
         d3.select(window)
           .on('keydown', keydown)
           .on('keyup', keyup);
         
         restart();

         
         
         return result.data;
     });
};
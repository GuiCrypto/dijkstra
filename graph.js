/* This module is the javascript conversion of GraphNetwork object from geoformat python library.
*  https://framagit.org/Guilhain/Geoformat
*  The original code is under the MIT license.
*/


/* GraphNetwork class
*
* Parameters
* ----------
* graph_object : dict
* The graph object
* The dict must be in the following format:
*  {
*   node_id_1: {
*       node_id_2: cost,
*       node_id_3: cost,
*       ...
*   },
*   node_id_2: {
*       node_id_1: cost,
*       node_id_3: cost,
*       ...
*   },
*   ...
* }
*/
class GraphNetwork {
    constructor(graph_object=null) {
        this._graph = {};
        if (graph_object != null) {
            this.build_graph_with_dict(graph_object);
        }
    }

    /* add a node in the graph
    *
    * Parameters
    * ----------
    * node_id : int
    *   The node id
    * links : dict
    *  The links of the node
    */
    add_node(node_id, links=null) {
        if ( !(node_id in this._graph)) {
            this._graph[node_id] = {}
        }
        else {
            console.error('Node still exists');
        }
    }

    /* add links to a node to the graph
    *
    * Parameters
    * ----------
    * node_id : int
    *  The node id
    * links : dict
    * The links of the node
    * create_node_if_not_exists : bool
    * If True, create the node if it doesn't exists
    * If False, raise an error if the node doesn't exists
    */
    add_links(node_id, links, create_node_if_not_exists=false) {

        if (! (node_id in this._graph)) {
            if (create_node_if_not_exists) {
                this.add_node(node_id=node_id);
            }
            else {
                console.error('node not exists');
            }
        }
        for (let link_node_id of Object.keys(links)) {
            let cost = links[link_node_id]
            if (!(link_node_id in this._graph)) {
                if (create_node_if_not_exists) {
                    this.add_node(link_node_id);
                }
                else {
                    console.error('node not exists')
                }
            }
            this._graph[node_id][link_node_id] = cost;

        }
    }
    
    * get_links_from_node(node_id) {
        if (node_id in this._graph) {
            for (let link_node_id of Object.keys(this._graph[node_id])) {
                yield link_node_id;
            }
        }
        else {
            console.error('node ', node_id," not exists");
        }
    }

    get_link_cost(link_id) {
        return this._graph[link_id[0]][link_id[1]];
    }

    /* build a graph from a dict
    *
    * Parameters
    * ----------
    * graph_object : dict
    * The graph object
    * The dict must be in the following format:
    *  {
    *   node_id_1: {
    *       node_id_2: cost,
    *       node_id_3: cost,
    *       ...
    *   },
    *   node_id_2: {
    *       node_id_1: cost,
    *       node_id_3: cost,
    *       ...
    *   },
    *   ...
    * }
    */ 
    build_graph_with_dict(graph_object) {
        for (let node_id of Object.keys(graph_object)) {
            let links = graph_object[node_id];
            this.add_links(node_id, links, true)
        }
    }


    _get_min_cost_node(table, node_check) {
        let min_cost = null;
        let min_node = null;
        for (let node_id of Object.keys(table)) {
            if (!(node_check.has(node_id))) {
                let node_cost = table[node_id]["cost"];
                if (min_cost === null) {
                    min_cost = node_cost;
                    min_node = node_id;
                }
                else {
                    if (node_cost<min_cost) {
                        min_cost = node_cost;
                        min_node = node_id;
                    }
                }
            }
        }

        return [min_node, min_cost];
    }

    _write_result_in_table(table, node_current, node_id, current_cost_plus_link_cost, step) {
        // write result in table
        let link_id_param = {
            "origin": [node_current],
            "cost": current_cost_plus_link_cost,
            "step": [step],
        };
        // first entry in table
        if (!(node_id in table)) {
            table[node_id] = link_id_param;
        } 
        else {
            if (table[node_id]["cost"] > current_cost_plus_link_cost) {
                table[node_id] = link_id_param;
            }
            else if (table[node_id]["cost"] == current_cost_plus_link_cost) {
                table[node_id]["origin"].push(node_current);
                table[node_id]["step"].push(step);
            }
        }
    
        return table;
    }


    * _get_min_path(table, node_start, node_end, multi_path, path=[]) {
        if (path.length == 0) {
            path = [node_end];
        }
        if (node_end != node_start) {
            for (let origin_node of table[node_end]["origin"]) {
                let new_path = path.concat([origin_node]);
                for (let result of this._get_min_path(
                    table,
                    node_start,
                    origin_node,
                    multi_path,
                    new_path,
                )) {
                    yield result;
                }
                // get only the first result if multi_path is False
                if (multi_path === false) {
                    break;
                }
            }
        }
        else {
            path.reverse();
            yield path;
        }
    }

    /* Dijkstra algorithm
    * compute the shortest path between node_start and node_end in GraphNetwork.
    *
    * Parameters
    * ----------
    * node_start : int
    *    The start node
    * node_end : int
    *   The end node
    * multi_path : bool
    *  If True, return all the shortest path between node_start and node_end
    *  If False, return only the first shortest path between node_start and node_end
    * 
    */ 
    dijkstra_algorithm(node_start, node_end, multi_path=False) {
    
        let table = {};
        let step = 0;
        let node_current = node_start;
        let current_cost = 0;
        let node_check = new Set([node_start]);
    
        // loop until node_end is checked
        while (node_current != node_end) {
    
            if (step > 0) {
                [node_current, current_cost] = this._get_min_cost_node(table, node_check)
            }
    
            for (let node_id of this.get_links_from_node(node_current)) {
                if (!(node_check.has(node_id))) {
                    let link_id = [node_current, node_id];
                    let link_cost = this.get_link_cost(link_id);
                    let current_cost_plus_link_cost = current_cost + link_cost;
                    table = this._write_result_in_table(table, node_current, node_id, current_cost_plus_link_cost, step);
                }
            }
            node_check.add(node_current);
            step += 1;
        }
    
        // compute path
        let path_list = []
        for (let path of this._get_min_path(table, node_start, node_end, multi_path)) {
            path_list.push(path)
        }
    
        return [current_cost, path_list];
    }
    

}

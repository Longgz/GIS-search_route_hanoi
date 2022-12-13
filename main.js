import roads_vertices from "./data/nodes4.js";
import roads from "./data/edges4.js";
import data_hanoi from "./data/small_data_hanoi.js";
import dijkstra from "./dijkstrajs/dijkstra.js";

function goc2(a, b, c) {
    let l = Math.sqrt(
        (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
    );
    let newX =
        ((c[0] - a[0]) * (b[0] - a[0]) + (c[1] - a[1]) * (b[1] - a[1])) / l;
    let newY =
        ((c[1] - a[1]) * (b[0] - a[0]) - (c[0] - a[0]) * (b[1] - a[1])) / l;
    if (newY > 0) return "Rẽ trái";
    else return "Rẽ phải";
}

function goc(a, b, c) {
    let vAB = [b[0] - a[0], b[1] - a[1]];
    let vBC = [c[0] - b[0], c[1] - b[1]];
    let cosV =
        (vAB[0] * vBC[0] + vAB[1] * vBC[1]) /
        (Math.sqrt(vAB[0] * vAB[0] + vAB[1] * vAB[1]) *
            Math.sqrt(vBC[0] * vBC[0] + vBC[1] * vBC[1]));
    let deg = Math.acos(cosV);
    return (deg * 180) / Math.PI;
}

// Remove duplicates in array
const removeDuplicates = (arr = []) => {
    const map = new Map();
    arr.forEach((x) => map.set(JSON.stringify(x), x));
    arr = [...map.values()];
    return arr;
};

// Haversine
function calculate_length(node_start, node_end) {
    Number.prototype.toRad = function () {
        return (this * Math.PI) / 180;
    };
    var d;
    var R = 6371; // km
    //has a problem with the .toRad() method below.
    var x1 = node_end[1] - node_start[1];
    var dLat = x1.toRad();
    var x2 = node_end[0] - node_start[0];
    var dLon = x2.toRad();
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(node_end[1].toRad()) *
            Math.cos(node_start[1].toRad()) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (d = R * c); // d chính là khoảng cách
}

function calculate_time(distance, speed) {
    let time = distance / speed;
    let min = Math.round(time / 60);
    let hour = 0;
    if (min > 60) {
        hour = Math.floor(min / 60);
        min = min % 60;
    }

    let time_return;
    if (hour != 0) {
        time_return = `${String(hour)} giờ ${String(min.toFixed()).padStart(
            2,
            "0"
        )} phút`;
    } else {
        time_return = `${String(min.toFixed()).padStart(2, "0")} phút`;
    }
    return time_return;
}

function convert_kmh_to_ms(speed) {
    return speed * (1 / 3.6);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function convert_type_road(type_road) {
    switch (type_road) {
        case "motorway":
            return "Đường cao tốc";
        case "trunk":
            return "Đường quốc lộ";
        case "primary":
            return "Đường tỉnh";
        case "secondary":
            return "Đường huyện";
        case "tertiary":
            return "Đường xã";
        case "residential":
            return "Đường dân cư";
        case "motorway_link":
            return "Đường liên kết đường cao tốc";
        case "trunk_link":
            return "Đường liên kết đường quốc lộ";
        case "primary_link":
            return "Đường liên kết đường tỉnh";
        case "secondary_link":
            return "Đường liên kết đường huyện";
        case "tertiary_link":
            return "Đường liên kết đường xã";
        case "living_street":
            return "Đường dân sinh";
        case "unclassified":
            return "Đường chưa phân loại";
        default:
            return capitalizeFirstLetter(type_road);
    }
}

function convert_speed(speed) {
    if (speed == "0") {
        return "60";
    } else {
        return speed;
    }
}

// Base of map
let view = new ol.View({
    projection: "EPSG:4326",
    center: [105.800509, 21.0115994],
    zoom: 12,
});

let osm_map = new ol.layer.Tile({
    source: new ol.source.OSM(),
    visible: true,
});

var map = new ol.Map({
    target: "map",
    layers: [osm_map],
    view: view,
});

// Layer to show path
const source = new ol.source.Vector();
const vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new ol.style.Stroke({
            color: "#ffcc33",
            width: 2,
        }),
    }),
    visible: true,
    zIndex: 10,
});

// Bound polygon small ha noi
const small_hanoi_source = new ol.source.Vector();
let small_data_line = new ol.format.GeoJSON().readFeatures(
    data_hanoi.features[0]
);
small_hanoi_source.addFeature(small_data_line[0]);

// Data vector
const small_hanoi_vector = new ol.layer.Vector({
    // source: new ol.source.Vector({
    //     format: new ol.format.GeoJSON(),
    //     url: "http://localhost:8080/geoserver/DHQS56/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=DHQS56%3Asmall_data_polygon&outputFormat=application%2Fjson",
    //     bbox: ol.loadingstrategy.bbox,
    // }),
    source: small_hanoi_source,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: "green",
            width: 2,
        }),
    }),
    visible: true,
    title: "hanoi_small",
    serverType: "geoserver",
    projection: "EPSG: 4326",
    zIndex: 1,
});

const source_road = new ol.source.Vector({
    // format: new ol.format.GeoJSON(),
    // url: "http://localhost:8080/geoserver/DHQS56/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=DHQS56%3Anew_edge_4&outputFormat=application%2Fjson",
    // bbox: ol.loadingstrategy.bbox,
    features: new ol.format.GeoJSON().readFeatures(roads),
});
const road_vector = new ol.layer.Vector({
    // source: new ol.source.Vector({
    //     format: new ol.format.GeoJSON(),
    //     url: "http://localhost:8080/geoserver/DHQS56/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=DHQS56%3Anew_edge_hn&outputFormat=application%2Fjson",
    //     bbox: ol.loadingstrategy.bbox,
    // }),
    source: source_road,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: "transparent",
            width: 1,
        }),
    }),
    visible: true,
    title: "road_vector",
    serverType: "geoserver",
    projection: "EPSG: 4326",
    zIndex: 1,
});

const vertices_source = new ol.source.Vector({
    features: new ol.format.GeoJSON().readFeatures(roads_vertices),
});
const vertices_vector = new ol.layer.Vector({
    // source: new ol.source.Vector({
    //     format: new ol.format.GeoJSON(),
    //     url: "http://localhost:8080/geoserver/DHQS56/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=DHQS56%3Anew_node_hn&outputFormat=application%2Fjson",
    //     bbox: ol.loadingstrategy.bbox,
    // }),
    source: vertices_source,
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 2,
            fill: new ol.style.Fill({
                color: "red",
            }),
            stroke: new ol.style.Stroke({
                color: "white",
                width: 1,
            }),
        }),
    }),
    visible: false,
    title: "vertices_vector",
    serverType: "geoserver",
    projection: "EPSG: 4326",
    zIndex: 200,
});

// Show search roads
const source_search = new ol.source.Vector();
const search_vector = new ol.layer.Vector({
    source: source_search,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: "red",
            width: 1,
        }),
        stroke: new ol.style.Stroke({
            width: 6,
            color: [0, 255, 0, 0.8],
        }),
    }),
    visible: true,
    title: "search_vector",
    serverType: "geoserver",
    projection: "EPSG: 4326",
    zIndex: 2,
});

const data_group = new ol.layer.Group({
    layers: [
        small_hanoi_vector,
        vertices_vector,
        road_vector,
        vector,
        search_vector,
    ],
});

// Add data layer to map
map.addLayer(data_group);

//Test add click
let point_click_1 = [];
let point_click_2 = [];
let cooord_Start;
let cooord_End;
document.querySelector("#get_start").addEventListener("click", function () {
    point_click_1 = [];
    map.once("click", function (evt) {
        let coord_abcs = evt.coordinate;

        let coord_geomtry = new ol.geom.Point(coord_abcs);
        cooord_Start = new ol.Feature({
            type: "cooord_Start",
            geometry: coord_geomtry,
        });
        cooord_Start.setStyle(
            new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 46],
                    anchorXUnits: "fraction",
                    anchorYUnits: "pixels",
                    src: "icon/start.png",
                    scale: 0.15,
                }),
            })
        );
        var closestFeature =
            source_road.getClosestFeatureToCoordinate(coord_abcs);

        // Kiểm tra nếu map chưa load kịp
        if (closestFeature != null) {
            source.addFeature(cooord_Start);
            console.log(closestFeature);

            // Add vào vị trí điểm vừa chọn
            if (closestFeature.A.name != null)
                $(".choice_point--detail_start").html(
                    `Vị trí điểm bắt đầu: Gần đường <strong>${closestFeature.A.name}</strong>`
                );
            else
                $(".choice_point--detail_start").html(
                    `Vị trí điểm bắt đầu: Gần đường <strong>Đường nhỏ</strong>`
                );

            // closestFeature.setStyle(
            //     new ol.style.Style({
            //         fill: new ol.style.Fill({
            //             color: "red",
            //             width: 1,
            //         }),
            //         stroke: new ol.style.Stroke({
            //             width: 6,
            //             color: "#0B87EF",
            //         }),
            //         lineDash: [4, 8],
            //         lineDashOffset: 4,
            //     })
            // );
            point_click_1.push(closestFeature.A.source);
            point_click_1.push(closestFeature.A.target);
            if ($("#get_end").attr("disabled")) {
                $(".reverse_route").removeClass("hideDiv");
                $(".search_route").removeClass("hideDiv");
                $(".data_clear").removeClass("hideDiv");
            }
        } else {
            $(".choice_point--detail_start").text(
                `Chưa lấy được vị trí, vui lòng thử lại!!`
            );
            $("#get_start").removeAttr("disabled");
        }
    });
});

document.querySelector("#get_end").addEventListener("click", function () {
    point_click_2 = [];
    map.once("click", function (evt) {
        let coord_abcs = evt.coordinate;
        let coord_geomtry = new ol.geom.Point(coord_abcs);
        cooord_End = new ol.Feature({
            type: "cooord_End",
            geometry: coord_geomtry,
        });
        cooord_End.setStyle(
            new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 46],
                    anchorXUnits: "fraction",
                    anchorYUnits: "pixels",
                    src: "icon/end.png",
                    scale: 0.05,
                }),
            })
        );

        var closestFeature =
            source_road.getClosestFeatureToCoordinate(coord_abcs);

        console.log(closestFeature);

        if (closestFeature != null) {
            source.addFeature(cooord_End);
            console.log(closestFeature);

            // Add vào vị trí điểm vừa chọn
            if (closestFeature.A.name != null)
                $(".choice_point--detail_end").html(
                    `Vị trí điểm kết thúc: Gần đường <strong>${closestFeature.A.name}</strong>`
                );
            else
                $(".choice_point--detail_end").html(
                    `Vị trí điểm kết thúc: Gần đường <strong>Đường nhỏ</strong>`
                );

            // closestFeature.setStyle(
            //     new ol.style.Style({
            //         fill: new ol.style.Fill({
            //             color: "red",
            //             width: 1,
            //         }),
            //         stroke: new ol.style.Stroke({
            //             width: 6,
            //             color: "#0B87EF",
            //         }),
            //     })
            // );
            point_click_2.push(closestFeature.A.source);
            point_click_2.push(closestFeature.A.target);
            if ($("#get_start").attr("disabled")) {
                $(".reverse_route").removeClass("hideDiv");
                $(".search_route").removeClass("hideDiv");
                $(".data_clear").removeClass("hideDiv");
            }
        } else {
            $(".choice_point--detail_end").text(
                `Chưa lấy được vị trí, vui lòng thử lại!!`
            );
            $("#get_end").removeAttr("disabled");
        }
    });
});

//------------------------------

// relations nodes
let graph = {};

// Get value object vertices
let nodes = Object.values(roads_vertices)[1];

// Get value object edges
let edges = Object.values(roads)[1];

// Edges features array
let edgesFeature = {};
let edgesFeatureName = {};
edges.forEach((edge) => {
    edgesFeature[edge.properties.path] = edge;
    if (edge.properties.name != null) {
        if (edgesFeatureName[edge.properties.name] == undefined) {
            let tmp_arr = [edge];
            edgesFeatureName[edge.properties.name] = tmp_arr;
        } else {
            edgesFeatureName[edge.properties.name].push(edge);
        }
    }
});

// Nodes features array
let nodesFeature = {};
nodes.forEach((node) => {
    nodesFeature[node.properties.id] = node;
});

let rela_arr = {};

// Get graph to use dijsktra
nodes.forEach((node) => {
    let source = node.properties.id;
    if (node.properties.relations != null) {
        let relations_arr = node.properties.relations.split(", ");
        // function to remove null in array
        // Filter same value
        relations_arr = relations_arr.filter(function (
            item,
            index,
            inputArray
        ) {
            return inputArray.indexOf(item) == index;
        });
        let path_length_obj = {};
        relations_arr.forEach((target) => {
            if (edgesFeature.hasOwnProperty(`${source}to${target}`)) {
                path_length_obj[target] =
                    edgesFeature[`${source}to${target}`].properties.geo_length;
            } else {
                path_length_obj[target] =
                    edgesFeature[`${target}to${source}`].properties.geo_length;
            }
        });

        graph[source] = path_length_obj;
        rela_arr[source] = relations_arr;
    } else {
        graph[source] = {};
        rela_arr[source] = {};
    }
});

var source_layer;
var vector_layer;
var geoMarker;
var end_pos;
var position;

let tmp_rela_2;
var arr_name_path = [];
var coord_arr_remove_duplicates = [];
let animating;

let step;
let node_start;
let node_end;
let length_default;
let move_default;
let move_n;

let index2;
let index3;
let total_length;
let count_index;
let new_start; // Hiển thị thông tin đầu 1 lần
let n1, n2, n3;
let route_dijsktra_length;

function get_route() {
    $(".route").removeClass("hideDiv");
    $(".move").removeClass("hideDiv");
    $(".set_speed").removeClass("hideDiv");
    console.log(arr_name_path);
    // Get two node near
    let point_start;
    let point_start_2;
    let point_end;
    let point_end_2;

    let r;
    let not_error;

    let length_node0_0_to_node1_0 = Math.sqrt(
        (point_click_1[0][0] - point_click_2[0][0]) *
            (point_click_1[0][1] - point_click_2[0][1])
    );
    let length_node0_1_to_node1_0 = Math.sqrt(
        (point_click_1[1][0] - point_click_2[0][0]) *
            (point_click_1[1][1] - point_click_2[0][1])
    );
    let length_node0_0_to_node1_1 = Math.sqrt(
        (point_click_1[0][0] - point_click_2[1][0]) *
            (point_click_1[0][1] - point_click_2[1][1])
    );
    if (length_node0_0_to_node1_0 < length_node0_1_to_node1_0) {
        point_start = point_click_1[0];
        point_start_2 = point_click_1[1];
    } else {
        point_start = point_click_1[1];
        point_start_2 = point_click_1[0];
    }
    if (length_node0_0_to_node1_0 < length_node0_0_to_node1_1) {
        point_end = point_click_2[0];
        point_end_2 = point_click_2[1];
    } else {
        point_end = point_click_2[1];
        point_end_2 = point_click_2[0];
    }

    not_error = true;
    try {
        // r = dijkstra.find_path(graph, 47678, 32210);
        r = dijkstra.find_path(graph, point_start, point_end);
    } catch (err) {
        not_error = false;
        console.log("Khong co duong di");
    }
    if (not_error == false) {
        try {
            r = dijkstra.find_path(graph, point_start_2, point_end);
        } catch (err) {
            console.log("Khong co duong di lan 2");
        }
    }
    console.log(r);
    console.log(r.solutions);
    console.log(r.dist);
    route_dijsktra_length = r.dist;
    $(".route_length").append(
        `Khoảng cách đường đi ngắn nhất: ${route_dijsktra_length.toFixed(
            2
        )} (m)`
    );
    $(".route_time").append(
        `Thời gian đi khoảng: ${calculate_time(
            route_dijsktra_length,
            convert_kmh_to_ms(40)
        )}`
    );
    $(".route_time--des").append(
        `<p><i>(Với vận tốc khoảng ${40} km/h và đường đi thông thoáng)</i></p>`
    );
    let route = r.solutions;
    console.log(route);

    // Số ngã rẽ (chưa hoàn thiện)
    tmp_rela_2 = [];
    for (let i = 0; i < route.length - 1; i++) {
        let tmp_relation = rela_arr[route[i]];
        tmp_rela_2.push(tmp_relation.length);
    }
    console.log(tmp_rela_2);

    // Coordinates of vertices: for marker run
    let coord_arr = [];
    let coord_arr_2 = []; // Mảng phụ dùng tính toán độ dài các tuyến đường

    // Get info of edges
    let edges_properties = [];
    let marker_arr = 100000;
    let marker_name = "none";

    for (let i = 0; i < route.length - 1; i++) {
        let edge_path;

        if (edgesFeature.hasOwnProperty(`${route[i]}to${route[i + 1]}`)) {
            edge_path = edgesFeature[`${route[i]}to${route[i + 1]}`];
        } else {
            edge_path = edgesFeature[`${route[i + 1]}to${route[i]}`];
        }

        let new_feature = new ol.format.GeoJSON().readFeatures(edge_path);
        let new_line = new_feature[0];

        new_line.setStyle(
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "red",
                    width: 1,
                }),
                stroke: new ol.style.Stroke({
                    width: 6,
                    color: "#0B87EF",
                }),
            })
        );
        source.addFeature(new_line);

        // Đánh dấu chỗ nào là đổi tên đường đi (Bắt đầu từ 100000)
        if (edge_path.properties.name != marker_name) {
            coord_arr.push(marker_arr);
            marker_name = edge_path.properties.name;
            marker_arr++;
        }

        if (edgesFeature.hasOwnProperty(`${route[i]}to${route[i + 1]}`)) {
            coord_arr.push(edge_path.geometry.coordinates);
            coord_arr_2.push(edge_path.geometry.coordinates);
        } else {
            let arr_reverse = edge_path.geometry.coordinates;
            arr_reverse = arr_reverse.reverse();
            coord_arr.push(arr_reverse);
            coord_arr_2.push(arr_reverse);
        }
        edges_properties.push(edge_path.properties);
    }
    console.log(coord_arr);
    console.log(coord_arr_2);
    console.log(edges_properties);

    // zoom to feature
    let extent = vector.getSource().getExtent();
    map.getView().fit(extent, map.getSize());

    // Tính khoảng cách từng tên đoạn đường
    // let arr_name_path = [];
    let arr_tmp = [];
    let name_edges = edges_properties[0].name;
    let length_of_edges = 0;
    for (let xll = 0; xll < coord_arr_2[0].length - 1; xll++) {
        length_of_edges =
            length_of_edges +
            calculate_length(coord_arr_2[0][xll], coord_arr_2[0][xll + 1]) *
                1000;
    }
    let fclass_edges = edges_properties[0].fclass;
    let maxspeed_edges = edges_properties[0].maxspeed;
    let oneway_edges = edges_properties[0].oneway;

    let count_of_name = 1;
    if (name_edges == null) {
        name_edges = `Đường nhỏ ${count_of_name}`;
        count_of_name++;
    }

    for (let l = 1; l < edges_properties.length; l++) {
        if (
            edges_properties[l].name == name_edges ||
            (edges_properties[l].name == null &&
                name_edges == `Đường nhỏ ${count_of_name - 1}`)
        ) {
            for (let xll = 0; xll < coord_arr_2[l].length - 1; xll++) {
                length_of_edges =
                    length_of_edges +
                    calculate_length(
                        coord_arr_2[l][xll],
                        coord_arr_2[l][xll + 1]
                    ) *
                        1000;
            }
        } else {
            arr_tmp.push(name_edges);
            arr_tmp.push(length_of_edges);
            arr_tmp.push(fclass_edges);
            arr_tmp.push(maxspeed_edges);
            arr_tmp.push(oneway_edges);
            arr_name_path.push(arr_tmp);
            arr_tmp = [];

            if (edges_properties[l].name == null) {
                name_edges = `Đường nhỏ ${count_of_name}`;
                length_of_edges = 0;
                for (let xll = 0; xll < coord_arr_2[l].length - 1; xll++) {
                    length_of_edges =
                        length_of_edges +
                        calculate_length(
                            coord_arr_2[l][xll],
                            coord_arr_2[l][xll + 1]
                        ) *
                            1000;
                }
                fclass_edges = edges_properties[l].fclass;
                maxspeed_edges = edges_properties[l].maxspeed;
                oneway_edges = edges_properties[l].oneway;
                count_of_name++;
            } else {
                name_edges = edges_properties[l].name;
                length_of_edges = 0;
                for (let xll = 0; xll < coord_arr_2[l].length - 1; xll++) {
                    length_of_edges =
                        length_of_edges +
                        calculate_length(
                            coord_arr_2[l][xll],
                            coord_arr_2[l][xll + 1]
                        ) *
                            1000;
                }
                fclass_edges = edges_properties[l].fclass;
                maxspeed_edges = edges_properties[l].maxspeed;
                oneway_edges = edges_properties[l].oneway;
            }
        }
    }
    arr_tmp.push(name_edges);
    arr_tmp.push(length_of_edges);
    arr_tmp.push(fclass_edges);
    arr_tmp.push(maxspeed_edges);
    arr_tmp.push(oneway_edges);
    arr_name_path.push(arr_tmp);

    console.log(arr_name_path);

    // Hiển thị độ dài từng đoạn đường
    $(".route_path").append(`Các tuyến đường đi qua:`);
    for (let lx = 0; lx < arr_name_path.length; lx++) {
        console.log(`${arr_name_path[lx][0]}: ${arr_name_path[lx][1]}`);
        $(".route_path").append(
            `<h4>${arr_name_path[lx][0]}: ${arr_name_path[lx][1].toFixed(2)}(m)
            <hr></h4>`
        );
    }

    let abcs = coord_arr.flat();
    // let coord_arr_remove_duplicates = removeDuplicates(abcs);
    coord_arr_remove_duplicates = removeDuplicates(abcs);
    console.log(coord_arr_remove_duplicates);

    // Create start position
    let start_pos = coord_arr_remove_duplicates[1];
    const position_s = new ol.geom.Point(start_pos);
    const startPos = new ol.Feature({
        type: "startPos",
        geometry: position_s,
    });

    // Create end position
    let length_of_array = coord_arr_remove_duplicates.length;
    end_pos = coord_arr_remove_duplicates[length_of_array - 1];
    const position_e = new ol.geom.Point(end_pos);
    const endPos = new ol.Feature({
        type: "endPos",
        geometry: position_e,
    });

    // Create marker
    let start_marker = coord_arr[1][0];
    position = new ol.geom.Point(start_marker);
    geoMarker = new ol.Feature({
        type: "geoMarker",
        geometry: position,
    });

    const styles = {
        route: new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 6,
                color: [237, 212, 0, 0.8],
            }),
        }),
        geoMarker: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({ color: "black" }),
                stroke: new ol.style.Stroke({
                    color: "white",
                    width: 2,
                }),
            }),
        }),
        startPos: new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 46],
                anchorXUnits: "fraction",
                anchorYUnits: "pixels",
                src: "icon/point.png",
                scale: 0.05,
            }),
        }),
        endPos: new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 46],
                anchorXUnits: "fraction",
                anchorYUnits: "pixels",
                src: "icon/point.png",
                scale: 0.05,
            }),
        }),
    };

    // Layer to show marker
    source_layer = new ol.source.Vector({
        features: [geoMarker, endPos, startPos],
    });
    vector_layer = new ol.layer.Vector({
        source: source_layer,
        style: function (feature) {
            return styles[feature.get("type")];
        },
        zIndex: 100,
    });

    map.addLayer(vector_layer);
    animating = false;

    step = 1;
    node_start = coord_arr_remove_duplicates[1];
    node_end = coord_arr_remove_duplicates[2];
    length_default = 100;
    move_default = 30;
    move_n = Math.floor(
        (move_default * calculate_length(node_start, node_end) * 1000) /
            length_default
    );

    if (move_n == 0) move_n = 1;

    index2 = 1;
    index3 = 2;
    total_length = calculate_length(node_start, node_end) * 1000;
    count_index = 0;
    new_start = true; // Hiển thị thông tin đầu 1 lần
    n1, n2, n3; // Tính góc -> rẽ
}

document.querySelector("#abc").addEventListener("click", get_route);

$(".get_speed").on("input", function () {
    let val_speed = Number($(".get_speed").val());
    if (val_speed < 51 && val_speed > 29) {
        move_default = 70 - val_speed;
        move_n = Math.floor(
            (move_default * calculate_length(node_start, node_end) * 1000) /
                length_default
        );
        $(".route_time").empty();
        $(".route_time").append(
            `Thời gian đi khoảng: ${calculate_time(
                route_dijsktra_length,
                convert_kmh_to_ms(val_speed)
            )}`
        );
        $(".route_time--des").empty();
        $(".route_time--des").append(
            `<p><i>(Với vận tốc khoảng ${val_speed} km/h và đường đi thông thoáng)</i></p>`
        );
    }
});

const startButton = document.getElementById("start");

function abcsx() {
    let l1 =
        (node_start[0] * (move_n - step)) / move_n +
        (node_end[0] * step) / move_n;

    let l2 =
        (node_start[1] * (move_n - step)) / move_n +
        (node_end[1] * step) / move_n;

    l1 = Number(l1.toFixed(7));
    l2 = Number(l2.toFixed(7));

    if (
        l1 == Number(end_pos[0].toFixed(7)) &&
        l2 == Number(end_pos[1].toFixed(7))
    ) {
        console.log("end");
        vector_layer.un("postrender", abcsx);
        console.log("un acess");
        $("#start").attr("disabled", true);
    }

    let currentCoordinate = [l1, l2];
    step++;
    if (
        l1 == Number(node_end[0].toFixed(7)) &&
        l2 == Number(node_end[1].toFixed(7))
    ) {
        if (tmp_rela_2[index2] > 2) {
            $(".alert").removeClass("hide");
            $(".alert").addClass("show");
            $(".alert").addClass("showAlert");
            setTimeout(function () {
                $(".alert").addClass("hide");
                $(".alert").removeClass("show");
                $(".alert").removeClass("showAlert");
            }, 1000);
        }
        index2++;

        node_start = coord_arr_remove_duplicates[index3];
        index3++;

        // Bỏ qua vị trí number
        if (
            typeof coord_arr_remove_duplicates[index3] == "number" &&
            coord_arr_remove_duplicates[index3] >= 100000
        ) {
            index3++;
        }

        node_end = coord_arr_remove_duplicates[index3];

        if (index3 < coord_arr_remove_duplicates.length - 1) {
            n1 = node_start;
            n2 = node_end;
            if (typeof coord_arr_remove_duplicates[index3 + 1] == "number") {
                n3 = coord_arr_remove_duplicates[index3 + 2];
            } else {
                n3 = coord_arr_remove_duplicates[index3 + 1];
            }

            if (goc(n1, n2, n3) > 30) {
                // console.log(goc2(n1, n2, n3));
                if (goc2(n1, n2, n3) == "Rẽ phải") {
                    $(".re2").html(`Rẽ phải ⤵️`);
                } else {
                    $(".re2").html(`Rẽ trái ⤴️`);
                }
            } else {
                $(".re2").html(`Đi thẳng ➡️`);
            }
        }

        let length_index = 0;
        try {
            length_index = calculate_length(node_start, node_end) * 1000;
        } catch {
            console.log("Đã hết đường đi");
        }

        total_length = total_length + length_index;

        move_n = Math.floor((move_default * length_index) / length_default);
        if (move_n == 0) move_n = 1;
        step = 1;

        if (count_index == 0) {
            $(".roads_info").empty();
            $(".roads_info").append(`<h3>Thông tin tuyến đường hiện tại</h3>`);
            $(".roads_info").append(
                `<h4>Tên: ${arr_name_path[count_index][0]}</h4>`
            );
            $(".roads_info").append(
                `<h4>Độ dài: ${arr_name_path[count_index][1].toFixed(
                    2
                )}(m)</h4>`
            );
            $(".roads_info").append(
                `<h4>Loại đường: ${convert_type_road(
                    arr_name_path[count_index][2]
                )}</h4>`
            );
            $(".roads_info").append(
                `<h4>Tốc độ tối đa: ${convert_speed(
                    arr_name_path[count_index][3]
                )}`
            );
            if (arr_name_path[count_index][4] == "B") {
                $(".roads_info").append(`<h4>Chiều: Hai chiều</h4>`);
            } else {
                $(".roads_info").append(`<h4>Chiều: Một chiều</h4>`);
            }
        }

        if (count_index < arr_name_path.length - 1) {
            $(".msg2").html(
                `Còn <span>${Math.floor(
                    Math.abs(total_length - arr_name_path[count_index][1])
                )} (m)</span> là đến đường: <span>${
                    arr_name_path[count_index + 1][0]
                }</span>`
            );

            if (Math.abs(total_length - arr_name_path[count_index][1]) < 1) {
                total_length = 0;
                count_index++;
                $(".roads_info").empty();
                $(".roads_info").append(
                    `<h3>Thông tin tuyến đường hiện tại</h3>`
                );
                $(".roads_info").append(
                    `<h4>Tên: ${arr_name_path[count_index][0]}</h4>`
                );
                $(".roads_info").append(
                    `<h4>Độ dài: ${arr_name_path[count_index][1].toFixed(
                        2
                    )}(m)</h4>`
                );
                $(".roads_info").append(
                    `<h4>Loại đường: ${convert_type_road(
                        arr_name_path[count_index][2]
                    )}</h4>`
                );
                $(".roads_info").append(
                    `<h4>Tốc độ tối đa: ${convert_speed(
                        arr_name_path[count_index][3]
                    )}`
                );
                if (arr_name_path[count_index][4] == "B") {
                    $(".roads_info").append(`<h4>Chiều: Hai chiều</h4>`);
                } else {
                    $(".roads_info").append(`<h4>Chiều: Một chiều</h4>`);
                }
            }
        } else {
            $(".msg2").html(
                `Còn <span>${Math.floor(
                    Math.abs(total_length - arr_name_path[count_index][1])
                )} (m)</span> là đến <span>Đích</span>`
            );
        }
    }

    position.setCoordinates(currentCoordinate);
    view.setCenter(currentCoordinate);
    view.setZoom(18);
}

function startAnimation() {
    $(".alert2").addClass("showAlert");
    $(".roads_info").removeClass("hideDiv");
    $(".get_speed").attr("disabled", true);
    animating = true;
    startButton.innerHTML = `<p><i class="fas fa-circle-stop"></i></p>`;
    vector_layer.on("postrender", abcsx);
    geoMarker.setGeometry(position);
    map.updateSize();
}

function stopAnimation() {
    console.log(1);
    animating = false;
    startButton.innerHTML = `<p><i class="fas fa-circle-play"></i></p>`;
    vector_layer.un("postrender", abcsx);
}

startButton.addEventListener("click", function () {
    console.log(123);
    if (animating) {
        stopAnimation();
    } else {
        startAnimation();
    }
});

// Get feature on click
map.on("click", function (evt) {
    let coord_abcs = evt.coordinate;
    var feature1 = map.forEachFeatureAtPixel(evt.pixel, function (feature1) {
        return feature1;
    });
    console.log(feature1);
    var closestFeature = source_road.getClosestFeatureToCoordinate(coord_abcs);
    console.log(closestFeature);
});

$(".search_roads--btn").on("click", function () {
    if ($(".search_roads--btn i").hasClass("fa-magnifying-glass")) {
        // Convert lowerCase to upCase[0];
        const stringSearch = $(".search_roads--input").val();
        let sentence = stringSearch.toLowerCase().split(" ");
        for (var i = 0; i < sentence.length; i++) {
            sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
        }
        let searchValue = sentence.join(" ");

        let search_arr = edgesFeatureName[searchValue];
        if (search_arr != undefined) {
            let search_length = 0;
            search_arr.forEach((val) => {
                let search_arr_coord = val.geometry.coordinates;
                for (let i = 0; i < search_arr_coord.length - 1; i++) {
                    search_length =
                        search_length +
                        calculate_length(
                            search_arr_coord[i],
                            search_arr_coord[i + 1]
                        ) *
                            1000;
                }
                let new_feature = new ol.format.GeoJSON().readFeatures(val);
                let new_line = new_feature[0];
                source_search.addFeature(new_line);
            });
            $(".search_roads_info").append(
                `<h3>Thông tin tuyến đường tìm kiếm: <span class="color_green">${searchValue}</span></h3>`
            );
            $(".search_roads_info").append(
                `<h4>Độ dài: ${search_length.toFixed(2)}(m)</h4>`
            );
            $(".search_roads_info").append(
                `<h4>Loại đường: ${convert_type_road(
                    search_arr[0].properties.fclass
                )}</h4>`
            );
            $(".search_roads_info").append(
                `<h4>Tốc độ tối đa: 
                ${convert_speed(search_arr[0].properties.maxspeed)}`
            );

            if (search_arr[0].properties.oneway == "B") {
                $(".search_roads_info").append(`<h4>Chiều: Hai chiều</h4>`);
            } else {
                $(".search_roads_info").append(`<h4>Chiều: Một chiều</h4>`);
            }
            // zoom to feature
            let extent = search_vector.getSource().getExtent();
            map.getView().fit(extent, map.getSize());
        } else {
            $(".search_roads_info").append(
                `<h3>Không tìm thấy tuyến đường: ${searchValue}</h3>`
            );
        }

        $(".search_roads--input").val(searchValue);
        $(".search_roads--btn i").removeClass("fa-magnifying-glass");
        $(".search_roads--btn i").addClass("fa-xmark");
    } else {
        $(".search_roads_info").empty();
        $(".search_roads--input").val("");
        $(".search_roads--btn i").removeClass("fa-xmark");
        $(".search_roads--btn i").addClass("fa-magnifying-glass");
        source_search.clear();
        source_search.refresh();
    }
});

function clear_data() {
    empty_detail();
    abled_button();
    reset_var();
    hide_class();
    source_search.clear();
    source_search.refresh();
    source.clear();
    source.refresh();
    source_layer.clear();
    source_layer.refresh();
}

function empty_detail() {
    $(".choice_point--detail_start").empty();
    $(".choice_point--detail_end").empty();
    $(".route_length").empty();
    $(".route_time").empty();
    $(".route_time--des").empty();
    $(".route_path").empty();
    $(".roads_info").empty();
    $(".get_speed").val("");
}

function abled_button() {
    $("#get_start").attr("disabled", false);
    $("#get_end").attr("disabled", false);
    $("#abc").attr("disabled", false);
    $("#start").attr("disabled", false);
    $(".get_speed").attr("disabled", false);
    startButton.innerHTML = `<p><i class="fas fa-circle-play"></i></p>`;
    $(".search_roads_info").empty();
    $(".search_roads--input").val("");
    $(".search_roads--btn i").removeClass("fa-xmark");
    $(".search_roads--btn i").addClass("fa-magnifying-glass");
}

function reset_var() {
    step = 1;
    node_start = [];
    node_end = [];
    length_default = 100;
    move_default = 30;
    move_n = 0;

    index2 = 1;
    index3 = 1;
    total_length = 0;
    count_index = 0;

    tmp_rela_2 = [];
    arr_name_path = [];
    coord_arr_remove_duplicates = [];
    animating = false;

    point_click_1 = [];
    point_click_2 = [];
}

function hide_class() {
    $(".reverse_route").addClass("hideDiv");
    $(".search_route").addClass("hideDiv");
    $(".route").addClass("hideDiv");
    $(".move").addClass("hideDiv");
    $(".roads_info").addClass("hideDiv");
    $(".data_clear").addClass("hideDiv");
    $(".set_speed").addClass("hideDiv");
    $(".alert2").removeClass("showAlert");
}

$("#clear").on("click", clear_data);

function reverse_route() {
    let tmp1 = point_click_1;
    let tmp2 = point_click_2;
    let tmp1_coord_start = cooord_Start.A.geometry.flatCoordinates;
    let tmp1_coord_end = cooord_End.A.geometry.flatCoordinates;
    clear_data();
    point_click_1 = tmp2;
    point_click_2 = tmp1;
    cooord_Start.A.geometry.flatCoordinates = tmp1_coord_end;
    cooord_End.A.geometry.flatCoordinates = tmp1_coord_start;
    $(".reverse_route").removeClass("hideDiv");
    $(".search_route").removeClass("hideDiv");
    $(".data_clear").removeClass("hideDiv");
    source.addFeature(cooord_Start);
    source.addFeature(cooord_End);

    get_route();
}

$("#reverse").on("click", reverse_route);

// GeoLocation
let myCoordinates;
let isErorr;
const geolocation = new ol.Geolocation({
    trackingOptions: {
        enableHighAccuracy: true,
    },
    projection: view.getProjection(),
});

$("#track").on("click", function () {
    // get tracking
    geolocation.setTracking(true);
    let myCoordinates = geolocation.getPosition();

    // // handle geolocation error
    // geolocation.on("error", function (error) {
    //     console.log(error.message);
    //     const error1 = document.getElementById("error");
    //     error1.innerHTML = "Vui lòng bật định vị vị trí rồi thử lại";
    //     isErorr = true;
    // });

    // if (isErorr == false) {
    //     const error1 = document.getElementById("error");
    //     error1.textContent = "";
    //     error1.innerHTML = "Success";
    // }

    // //create accuracy Feature
    // const accuracyFeature = new ol.Feature();
    // geolocation.on("change:accuracyGeometry", function () {
    //     accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
    // });

    // const positionFeature = new ol.Feature();
    // positionFeature.setStyle(
    //     new ol.style.Style({
    //         image: new ol.style.Circle({
    //             radius: 6,
    //             fill: new ol.style.Fill({
    //                 color: "red",
    //             }),
    //             stroke: new ol.style.Stroke({
    //                 color: "#fff",
    //                 width: 1,
    //             }),
    //         }),
    //     })
    // );

    // Cập nhật vị trí theo thời gian
    // geolocation.on("change:position", function () {
    //     myCoordinates = geolocation.getPosition();
    //     positionFeature.setGeometry(
    //         myCoordinates ? new ol.geom.Point(myCoordinates) : null
    //     );
    //     console.log(myCoordinates);
    // });

    // const locationLayer = new ol.layer.Vector({
    //     map: map,
    //     source: new ol.source.Vector({
    //         features: [accuracyFeature, positionFeature],
    //     }),
    //     title: "locationLayer",
    // });

    if (myCoordinates != undefined) {
        let coord_geomtry = new ol.geom.Point(myCoordinates);
        cooord_Start = new ol.Feature({
            type: "cooord_Start",
            geometry: coord_geomtry,
        });
        cooord_Start.setStyle(
            new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 46],
                    anchorXUnits: "fraction",
                    anchorYUnits: "pixels",
                    src: "icon/start.png",
                    scale: 0.15,
                }),
            })
        );
        var closestFeature =
            source_road.getClosestFeatureToCoordinate(myCoordinates);

        // Kiểm tra nếu map chưa load kịp
        if (closestFeature != null) {
            source.addFeature(cooord_Start);
            console.log(closestFeature);

            // Add vào vị trí điểm vừa chọn
            if (closestFeature.A.name != null)
                $(".choice_point--detail_start").html(
                    `Vị trí điểm bắt đầu: Gần đường <strong>${closestFeature.A.name}</strong>`
                );
            else
                $(".choice_point--detail_start").html(
                    `Vị trí điểm bắt đầu: Gần đường <strong>Đường nhỏ</strong>`
                );

            point_click_1.push(closestFeature.A.source);
            point_click_1.push(closestFeature.A.target);
            $("#get_start").attr("disabled", true);
            if ($("#get_end").attr("disabled")) {
                $(".reverse_route").removeClass("hideDiv");
                $(".search_route").removeClass("hideDiv");
                $(".data_clear").removeClass("hideDiv");
            }
        } else {
            $(".choice_point--detail_start").text(
                `Chưa lấy được vị trí, vui lòng thử lại!!`
            );
            $("#get_start").removeAttr("disabled");
        }
    }
});

// end geolocation

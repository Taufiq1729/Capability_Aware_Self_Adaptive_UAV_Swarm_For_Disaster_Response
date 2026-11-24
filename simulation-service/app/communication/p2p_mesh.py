import math
import random
import time
import networkx as nx
from typing import Dict, Any, List, Set, Tuple, Optional

class P2PCommunicationMesh:
    """
    Stage 6: Peer-to-Peer Ad-hoc Communication Mesh using NetworkX.
    Models wireless topology, distance attenuation, message packet loss,
    and temporary network partitions without any central gateway.
    Computes NetworkX graph metrics including betweenness centrality
    to prove how Relay nodes bridge separate search clusters.
    """
    def __init__(self, comm_range: float = 240.0, base_packet_loss: float = 0.03):
        self.comm_range = comm_range
        self.base_packet_loss = base_packet_loss
        self.graph = nx.Graph()
        self.message_queues: Dict[str, List[Dict[str, Any]]] = {}

    def update_topology(
        self,
        drone_positions: Dict[str, Tuple[float, float]],
        drone_comm_health: Dict[str, float],
        drone_floors: Optional[Dict[str, int]] = None,
        stairwell_xy: Tuple[float, float] = (390.0, 310.0),
        stairwell_radius: float = 85.0
    ) -> nx.Graph:
        """
        Reconstructs the communication graph based on Euclidean distance,
        individual radio health, and 3D architectural floor slab RF attenuation.
        RF signals attenuate drastically through solid concrete floor slabs (-20 dB),
        unless either drone is stationed inside the central vertical stairwell shaft/corridor.
        """
        self.graph.clear()
        dids = list(drone_positions.keys())
        floors = drone_floors or {d: 1 for d in dids}
        for d in dids:
            self.graph.add_node(d, pos=drone_positions[d], floor=floors.get(d, 1))
            if d not in self.message_queues:
                self.message_queues[d] = []

        # Add edges for drones within transmission range
        for i in range(len(dids)):
            for j in range(i + 1, len(dids)):
                id_a, id_b = dids[i], dids[j]
                p_a, p_b = drone_positions[id_a], drone_positions[id_b]
                dist_2d = math.hypot(p_a[0] - p_b[0], p_a[1] - p_b[1])
                floor_a = floors.get(id_a, 1)
                floor_b = floors.get(id_b, 1)
                floor_diff = abs(floor_a - floor_b)
                
                # 3D distance including floor vertical elevation (each floor ~ 35m in scale)
                dist_3d = math.hypot(dist_2d, floor_diff * 35.0)

                # Base effective range modulated by radio health
                base_range = self.comm_range * min(drone_comm_health.get(id_a, 1.0), drone_comm_health.get(id_b, 1.0))
                
                # Check for 3D Concrete Floor Slab RF Attenuation vs Stairwell Waveguide
                is_stairwell_bridge = False
                if floor_diff > 0:
                    dist_a_stair = math.hypot(p_a[0] - stairwell_xy[0], p_a[1] - stairwell_xy[1])
                    dist_b_stair = math.hypot(p_b[0] - stairwell_xy[0], p_b[1] - stairwell_xy[1])
                    # If either drone is inside the vertical stairwell duct, signal propagates vertically
                    if dist_a_stair <= stairwell_radius or dist_b_stair <= stairwell_radius:
                        effective_range = base_range * 0.95 # Stairwell vertical line-of-sight duct
                        is_stairwell_bridge = True
                    else:
                        # Solid reinforced concrete slabs heavily attenuate RF (reduces through-slab range to 55m)
                        effective_range = min(55.0, base_range * (0.22 ** floor_diff))
                else:
                    effective_range = base_range

                if dist_3d <= effective_range:
                    dist_factor = dist_3d / max(1.0, effective_range)
                    slab_penalty = 0.12 * floor_diff if not is_stairwell_bridge else 0.03
                    loss_prob = min(0.85, self.base_packet_loss + 0.30 * (dist_factor ** 2) + slab_penalty)
                    self.graph.add_edge(
                        id_a,
                        id_b,
                        distance=round(dist_3d, 1),
                        loss_prob=round(loss_prob, 3),
                        is_stairwell_bridge=is_stairwell_bridge,
                        floor_diff=floor_diff
                    )

        return self.graph

    def broadcast_message(self, sender_id: str, payload: Dict[str, Any], sim_time: float) -> List[Dict[str, Any]]:
        delivered = []
        if sender_id not in self.graph:
            return delivered

        neighbors = list(self.graph.neighbors(sender_id))
        for target_id in neighbors:
            edge_data = self.graph.get_edge_data(sender_id, target_id)
            loss_prob = edge_data.get("loss_prob", 0.05) if edge_data else 0.05
            
            if random.random() >= loss_prob:
                msg = {
                    "sender_id": sender_id,
                    "target_id": target_id,
                    "payload": payload,
                    "sim_time": sim_time,
                    "latency_ms": round(random.uniform(12.0, 38.0), 1)
                }
                self.message_queues[target_id].append(msg)
                delivered.append(msg)

        return delivered

    def pop_messages_for_drone(self, drone_id: str) -> List[Dict[str, Any]]:
        msgs = self.message_queues.get(drone_id, [])
        self.message_queues[drone_id] = []
        return msgs

    def get_topology_snapshot(self) -> Dict[str, Any]:
        """Returns JSON-serializable snapshot of the NetworkX graph nodes, edges and metrics"""
        nodes = []
        for n in self.graph.nodes:
            pos = self.graph.nodes[n].get("pos", (0, 0))
            nodes.append({"id": n, "x": pos[0], "y": pos[1]})

        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "distance": data.get("distance", 0),
                "loss_prob": data.get("loss_prob", 0),
                "is_stairwell_bridge": data.get("is_stairwell_bridge", False),
                "floor_diff": data.get("floor_diff", 0)
            })

        connected_components = [list(c) for c in nx.connected_components(self.graph)]
        is_partitioned = len(connected_components) > 1

        # NetworkX Advanced Graph Centrality & Spectral Metrics
        betweenness = {}
        clustering_coeff = 0.0
        if len(self.graph.nodes) > 0:
            raw_betweenness = nx.betweenness_centrality(self.graph)
            betweenness = {k: round(v, 3) for k, v in raw_betweenness.items()}
            clustering_coeff = round(float(nx.average_clustering(self.graph)), 3)

        return {
            "nodes": nodes,
            "edges": edges,
            "connected_components": connected_components,
            "is_partitioned": is_partitioned,
            "num_links": len(edges),
            "betweenness_centrality": betweenness,
            "clustering_coefficient": clustering_coeff,
            "stairwell_corridor": {"x": 390.0, "y": 310.0, "radius": 85.0},
            "rf_floor_attenuation_db": 20.0,
            "library": "NetworkX v" + nx.__version__
        }

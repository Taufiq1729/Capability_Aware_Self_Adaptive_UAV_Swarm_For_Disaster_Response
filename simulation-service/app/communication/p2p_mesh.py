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
    """
    def __init__(self, comm_range: float = 230.0, base_packet_loss: float = 0.04):
        self.comm_range = comm_range
        self.base_packet_loss = base_packet_loss
        self.graph = nx.Graph()
        self.message_queues: Dict[str, List[Dict[str, Any]]] = {} # drone_id -> messages

    def update_topology(self, drone_positions: Dict[str, Tuple[float, float]], drone_comm_health: Dict[str, float]) -> nx.Graph:
        """
        Reconstructs the communication graph based on Euclidean distance
        and individual radio health.
        """
        self.graph.clear()
        dids = list(drone_positions.keys())
        for d in dids:
            self.graph.add_node(d, pos=drone_positions[d])
            if d not in self.message_queues:
                self.message_queues[d] = []

        # Add edges for drones within transmission range
        for i in range(len(dids)):
            for j in range(i + 1, len(dids)):
                id_a, id_b = dids[i], dids[j]
                p_a, p_b = drone_positions[id_a], drone_positions[id_b]
                dist = math.hypot(p_a[0] - p_b[0], p_a[1] - p_b[1])
                
                # Effective range is reduced if either radio is degraded
                effective_range = self.comm_range * min(drone_comm_health.get(id_a, 1.0), drone_comm_health.get(id_b, 1.0))
                
                if dist <= effective_range:
                    # Packet delivery probability decreases with distance
                    dist_factor = dist / max(1.0, effective_range)
                    loss_prob = self.base_packet_loss + 0.35 * (dist_factor ** 2)
                    self.graph.add_edge(id_a, id_b, distance=round(dist, 1), loss_prob=round(loss_prob, 3))

        return self.graph

    def broadcast_message(self, sender_id: str, payload: Dict[str, Any], sim_time: float) -> List[Dict[str, Any]]:
        """
        Broadcasts a message from sender to all 1-hop reachable peers,
        accounting for simulated packet drop.
        """
        delivered = []
        if sender_id not in self.graph:
            return delivered

        neighbors = list(self.graph.neighbors(sender_id))
        for target_id in neighbors:
            edge_data = self.graph.get_edge_data(sender_id, target_id)
            loss_prob = edge_data.get("loss_prob", 0.05) if edge_data else 0.05
            
            # Stochastic packet loss
            if random.random() >= loss_prob:
                msg = {
                    "sender_id": sender_id,
                    "target_id": target_id,
                    "payload": payload,
                    "sim_time": sim_time,
                    "latency_ms": round(random.uniform(15.0, 45.0), 1)
                }
                self.message_queues[target_id].append(msg)
                delivered.append(msg)

        return delivered

    def pop_messages_for_drone(self, drone_id: str) -> List[Dict[str, Any]]:
        msgs = self.message_queues.get(drone_id, [])
        self.message_queues[drone_id] = []
        return msgs

    def get_topology_snapshot(self) -> Dict[str, Any]:
        """Returns JSON-serializable snapshot of the graph nodes, edges and partitions"""
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
                "loss_prob": data.get("loss_prob", 0)
            })

        connected_components = [list(c) for c in nx.connected_components(self.graph)]
        is_partitioned = len(connected_components) > 1

        return {
            "nodes": nodes,
            "edges": edges,
            "connected_components": connected_components,
            "is_partitioned": is_partitioned,
            "num_links": len(edges)
        }


#include "graph.h"

/*
 * Lightweight C service layer.
 *
 * The browser application talks to this program through a local TCP/HTTP
 * bridge in production deployments. For this self-contained college
 * project, main.c also provides a command-line API useful for testing the
 * DSA engine independently.
 *
 * Commands:
 *   demo
 *   route SOURCE TARGET
 *   bfs SOURCE
 *   dfs SOURCE
 *   mst
 */
static void seed(Graph *g) {
    const char *names[] = {
        "Central Square", "Tech Park", "City Hospital", "Railway Station",
        "University Gate", "Airport Junction", "Market Street", "River Bridge"
    };
    double xy[][2] = {
        {49,50},{20,29},{20,72},{49,13},{49,86},{84,70},{72,35},{80,14}
    };
    for (int i=0;i<8;i++) graph_add_vertex(g,names[i],xy[i][0],xy[i][1]);

    graph_add_road(g,0,1,8,true);  graph_add_road(g,0,2,12,true);
    graph_add_road(g,0,6,7,true);  graph_add_road(g,1,3,10,true);
    graph_add_road(g,1,4,9,true);  graph_add_road(g,2,4,6,true);
    graph_add_road(g,2,5,15,true); graph_add_road(g,3,5,11,true);
    graph_add_road(g,3,6,5,true);  graph_add_road(g,4,6,8,true);
    graph_add_road(g,4,7,13,true); graph_add_road(g,5,7,9,true);
    graph_add_road(g,6,7,10,true); graph_add_road(g,5,8,6,true);
}

int main(int argc, char **argv) {
    Graph *g = graph_create(8);
    if (!g) return 1;
    seed(g);

    if (argc >= 2 && strcmp(argv[1], "route") == 0 && argc >= 4) {
        char *end_s, *end_t;
        long s=strtol(argv[2], &end_s, 10), t=strtol(argv[3], &end_t, 10);
        if (*end_s || *end_t || s < 0 || s >= g->vertices || t < 0 || t >= g->vertices) {
            fprintf(stderr, "Invalid source or target. Use node IDs 0-%d.\\n", g->vertices - 1);
        } else {
            DijkstraResult *r=dijkstra(g,(int)s);
            if(r){ dijkstra_print_path(g,r,(int)t); dijkstra_free(r); }
            else fprintf(stderr, "Unable to calculate route.\\n");
        }
    } else if(argc >= 2 && strcmp(argv[1],"bfs")==0 && argc>=3) {
        int *order=malloc((size_t)g->vertices*sizeof(int));
        int n=bfs_count(g,atoi(argv[2]),order);
        for(int i=0;i<n;i++) printf("%d%c",order[i],i+1==n?'\n':' ');
        free(order);
    } else if(argc >= 2 && strcmp(argv[1],"dfs")==0 && argc>=3) {
        int *order=malloc((size_t)g->vertices*sizeof(int));
        int n=dfs_count(g,atoi(argv[2]),order);
        for(int i=0;i<n;i++) printf("%d%c",order[i],i+1==n?'\n':' ');
        free(order);
    } else if(argc >= 2 && strcmp(argv[1],"mst")==0) {
        MSTResult *r=kruskal(g);
        if(r){ printf("MST cost=%d edges=%d connected=%s\n",
             r->total_cost,r->edge_count,r->connected?"yes":"no"); mst_free(r); }
    } else {
        printf("Smart Traffic C engine ready. Use: route, bfs, dfs or mst.\n");
    }
    graph_free(g);
    return 0;
}

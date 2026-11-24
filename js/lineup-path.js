/* Smooth paths shared by the editor preview and recorded video. */
globalThis.TK7Path = (() => {
    function prepare(start, route) {
        const points = [start, ...route].filter((point, index, all) =>
            !index || Math.hypot(point.x - all[index - 1].x, point.y - all[index - 1].y) > .01);
        let samples=points.map(point=>({...point}));
        // Corner cutting stays within the original route instead of overshooting sharp turns.
        for(let pass=0;pass<3&&samples.length>1;pass++){
            const next=[samples[0]];
            for(let i=0;i<samples.length-1;i++){
                const a=samples[i],b=samples[i+1];
                next.push({x:.75*a.x+.25*b.x,y:.75*a.y+.25*b.y},
                    {x:.25*a.x+.75*b.x,y:.25*a.y+.75*b.y});
            }
            next.push(samples[samples.length-1]);samples=next;
        }
        samples[0].offset=0;
        let length = 0;
        for (let i = 1; i < samples.length; i++) {
            length += Math.hypot(samples[i].x - samples[i-1].x, samples[i].y - samples[i-1].y);
            samples[i].offset = length;
        }
        return samples.map(point => ({ ...point, offset: length ? point.offset / length : 0 }));
    }
    function position(path, progress) {
        const t = Math.max(0,Math.min(1,progress));
        if (path.length === 1 || t === 0) return path[0];
        if (t === 1) return path[path.length-1];
        let low = 1, high = path.length-1;
        while (low < high) { const middle = (low+high)>>1; if (path[middle].offset < t) low=middle+1; else high=middle; }
        const a=path[low-1], b=path[low], fraction=(t-a.offset)/(b.offset-a.offset||1);
        return { x:a.x+(b.x-a.x)*fraction, y:a.y+(b.y-a.y)*fraction };
    }
    return { prepare, position };
})();

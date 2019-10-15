// I am not a Javascript, so borrowed from
// https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag.
function draw_arrow(ctx, from_x, from_y, to_x, to_y) {
    var head_size = 10;
    var dx = to_x - from_x;
    var dy = to_y - from_y;
    var angle = Math.atan2(dy, dx);

    ctx.moveTo(from_x, from_y);
    ctx.lineTo(to_x, to_y);

    ctx.lineTo(to_x - head_size * Math.cos(angle - Math.PI / 6), to_y - head_size * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to_x, to_y);
    ctx.lineTo(to_x - head_size * Math.cos(angle + Math.PI / 6), to_y - head_size * Math.sin(angle + Math.PI / 6));
}

var uvw = {
    render: function() {
        var canvas = document.getElementById('uvw-only');
        var ctx = canvas.getContext('2d');

        var origin_x = canvas.width / 2;
        var origin_y = canvas.height / 2;

        // Draw cartesian axes.
        ctx.beginPath();
        ctx.setLineDash([5]);
        ctx.moveTo(0, origin_y);
        ctx.lineTo(canvas.width, origin_y);
        ctx.moveTo(origin_x, 0);
        ctx.lineTo(origin_x, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw dominant axes.
        var length = 0.8 * Math.min(canvas.width, canvas.height) / 2;

        var theta_u = 0 * 2 * Math.PI / 3;
        var u_y = origin_y - length * Math.sin(theta_u);
        var u_x = origin_x + length * Math.cos(theta_u);

        var theta_v = 1 * 2 * Math.PI / 3;
        var v_y = origin_y - length * Math.sin(theta_v);
        var v_x = origin_x + length * Math.cos(theta_v);

        var theta_w = 2 * 2 * Math.PI / 3;
        var w_y = origin_y - length * Math.sin(theta_w);
        var w_x = origin_x + length * Math.cos(theta_w);

        ctx.beginPath();
        ctx.lineWidth = 2;
        draw_arrow(ctx, origin_x, origin_y, u_x, u_y);
        draw_arrow(ctx, origin_x, origin_y, v_x, v_y);
        draw_arrow(ctx, origin_x, origin_y, w_x, w_y);
        ctx.stroke();

        // Draw some labels for clarity.
        ctx.font = '16px serif';
        ctx.fillText('u', u_x, u_y + 16);
        ctx.fillText('v', v_x - 16, v_y);
        ctx.fillText('w', w_x - 16, w_y);
        ctx.fillText('α', canvas.width - 8, origin_y - 4);
        ctx.fillText('β', origin_x + 4, 16);
    }
};

uvw.render();

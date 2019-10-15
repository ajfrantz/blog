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

var svm = {
    render: function() {
        var canvas = document.getElementById('svm-states');
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

        ctx.font = '16px serif';
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
            var theta = i * 2 * Math.PI / 6;
            var y = origin_y - length * Math.sin(theta);
            var x = origin_x + length * Math.cos(theta);
            draw_arrow(ctx, origin_x, origin_y, x, y);

            var y = origin_y - (length + 8) * Math.sin(theta + 0.15);
            var x = origin_x + (length + 8) * Math.cos(theta + 0.15);
            ctx.fillText('S' + (i + 1), x, y);
        }
        ctx.stroke();
    }
};

svm.render();

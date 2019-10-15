// Warning to those viewing source: this is a messy implementation used for
// hacking around when I was trying to learn the relevant math.  It's not
// recommended for direct usage in production--it does many things in the least
// efficient way possible in order to accelerate understanding.

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

var decomp = {
    command_screen: {x: 220, y: 120},
    render_axes: function(ctx, origin_x, origin_y) {
        // Label axes.
        ctx.font = '16px serif';
        ctx.fillText('α', 2 * origin_x - 8, origin_y - 4);
        ctx.fillText('β', origin_x + 4, 16);

        // Draw cartesian axes.
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.setLineDash([5]);

        ctx.moveTo(0, origin_y);
        ctx.lineTo(2 * origin_x, origin_y);
        ctx.moveTo(origin_x, 0);
        ctx.lineTo(origin_x, 2 * origin_y);
        ctx.stroke();
        ctx.setLineDash([]);
    },
    render_command: function(ctx, origin_x, origin_y, lower_basis, upper_basis, sextant, command_sv) {
        // Draw relevant SVM base states.
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;

        draw_arrow(ctx, origin_x, origin_y, lower_basis.x, lower_basis.y);
        draw_arrow(ctx, origin_x, origin_y, upper_basis.x, upper_basis.y);

        ctx.stroke();

        // Draw the command itself.
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        draw_arrow(ctx, origin_x, origin_y, this.command_screen.x, this.command_screen.y);
        ctx.stroke();

        // Display current commanded values in upper left..
        ctx.fillText('α: ' + command_sv.alpha.toFixed(2), 0, 16);
        ctx.fillText('β: ' + command_sv.beta.toFixed(2), 0, 32);
        ctx.fillText('sextant: ' + sextant, 0, 48);
    },
    render_components: function(ctx, origin_x, origin_y, lower, upper) {
        // Draw components.
        ctx.beginPath();
        ctx.strokeStyle = 'blue';

        draw_arrow(ctx, origin_x, origin_y, lower.x, lower.y);
        draw_arrow(ctx, lower.x, lower.y, lower.x + (upper.x - origin_x), lower.y + (upper.y - origin_y));

        ctx.stroke();

        // And dashed components in the other possible positions.
        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.setLineDash([2]);

        draw_arrow(ctx, origin_x, origin_y, upper.x, upper.y);
        draw_arrow(ctx, upper.x, upper.y, upper.x + (lower.x - origin_x), upper.y + (lower.y - origin_y));

        ctx.stroke();
    },
    render_clamped: function(ctx, origin_x, origin_y, clamped, sextant, t_lower, t_upper, t_off) {
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        draw_arrow(ctx, origin_x, origin_y, clamped.x, clamped.y);

        ctx.stroke();
        ctx.strokeStyle = 'black';

        ctx.fillText('S' + sextant + ': ' + t_lower.toFixed(2), 0, 268);
        ctx.fillText('S' + (sextant + 1) + ': ' + t_upper.toFixed(2), 0, 284);
        ctx.fillText('null: ' + t_off.toFixed(2), 0, 300);
    },
    render: function() {
        var canvas = document.getElementById('decomp');
        var ctx = canvas.getContext('2d');

        var origin_x = canvas.width / 2;
        var origin_y = canvas.height / 2;

        // Transform canvas coordinate frame -> (α, β).
        function screen2sv(screen) {
            return {
                alpha: (screen.x - origin_x) / origin_x,
                beta:  -(screen.y - origin_y) / origin_y,
            };
        }

        // Transform (α, β) -> canvas coordinate frame.
        function sv2screen(sv) {
            return {
                x: sv.alpha * origin_x + origin_x,
                y: -sv.beta * origin_y + origin_y,
            };
        }

        // Rotate a space vector.
        function rotate(sv, dtheta) {
            return {
                alpha: sv.alpha * Math.cos(dtheta) - sv.beta * Math.sin(dtheta),
                beta:  sv.alpha * Math.sin(dtheta) + sv.beta * Math.cos(dtheta),
            };
        }

        var command_sv = screen2sv(this.command_screen);

        // Decompose.
        var theta = Math.atan2(command_sv.beta, command_sv.alpha);
        var sextant = function() {
            while (theta < 0) {
                theta += 2*Math.PI;
            }
            // Using 1-indexed sextants here, similar to quadrant numbering for
            // cartesian plots.
            for (var i = 0; i <= 6; i++) {
                var lower = (i - 1) * 2 * Math.PI / 6;
                var upper = i * 2 * Math.PI / 6;
                if (theta >= lower && theta <= upper) {
                    return i;
                }
            }
            console.log("Should be unreachable?");
        }();

        var lower_theta = (sextant - 1) * 2 * Math.PI / 6;
        var upper_theta = sextant * 2 * Math.PI / 6;

        var unit = {alpha: 1.0, beta: 0.0};
        var lower_basis = sv2screen(rotate(unit, lower_theta));
        var upper_basis = sv2screen(rotate(unit, upper_theta));

        var rotated = rotate(command_sv, -lower_theta);
        var t_lower = rotated.alpha - rotated.beta / Math.sqrt(3);
        var t_upper = 2 * rotated.beta / Math.sqrt(3);

        var lower_comp = { alpha: t_lower, beta: 0 };
        var upper_comp = { alpha: t_upper, beta: 0 };
        lower_comp = rotate(lower_comp, lower_theta);
        upper_comp = rotate(upper_comp, upper_theta);

        var clamped = false;
        var max_duty = 0.95;
        var raw_duty = t_lower + t_upper;
        if (raw_duty > max_duty) {
            clamped = true;
            t_lower = max_duty * t_lower / raw_duty;
            t_upper = max_duty * t_upper / raw_duty;
        }
        var t_off = 1.0 - t_upper - t_lower;

        var lower_clamped = { alpha: t_lower, beta: 0 };
        var upper_clamped = { alpha: t_upper, beta: 0 };
        lower_clamped = rotate(lower_clamped, lower_theta);
        upper_clamped = rotate(upper_clamped, upper_theta);
        var net_clamped = {
            alpha: lower_clamped.alpha + upper_clamped.alpha,
            beta:  lower_clamped.beta  + upper_clamped.beta,
        };

        this.render_axes(ctx, origin_x, origin_y);
        this.render_command(ctx, origin_x, origin_y, lower_basis, upper_basis, sextant, command_sv);
        this.render_components(ctx, origin_x, origin_y, sv2screen(lower_comp), sv2screen(upper_comp));

        var canvas = document.getElementById('decomp-clamped');
        var ctx = canvas.getContext('2d');
        this.render_axes(ctx, origin_x, origin_y);
        this.render_command(ctx, origin_x, origin_y, lower_basis, upper_basis, sextant, command_sv);
        this.render_components(ctx, origin_x, origin_y, sv2screen(lower_comp), sv2screen(upper_comp));
        if (clamped) {
            this.render_clamped(ctx, origin_x, origin_y, sv2screen(net_clamped), sextant, t_lower, t_upper, t_off);
        }
    },
    onClick: function(event) {
        this.command_screen = { x: event.offsetX, y: event.offsetY };

        var canvas = document.getElementById('decomp');
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var canvas = document.getElementById('decomp-clamped');
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        decomp.render();
    },
};

decomp.render();
document.getElementById('decomp').addEventListener('click', decomp.onClick.bind(decomp), false);
document.getElementById('decomp-clamped').addEventListener('click', decomp.onClick.bind(decomp), false);

var pwm = {
    render: function() {
        var canvas = document.getElementById('pwm');
        var ctx = canvas.getContext('2d');

        ctx.font = '16px serif';
        ctx.fillText('Counter', 0, 16);
        ctx.fillText('Output', 0, 120);

        let plot_left = 80;
        let counter_bottom = 80;
        let output_bottom = 120;
        var y_per_count = 3.4;

        var plot_width = canvas.width - plot_left - 20;
        var steps = plot_width / 5;
        var top = steps / 2;
        var counter = 0;
        var direction = 1;
        var match = Math.round(0.8 * top);

        // Draw triangle wave.
        ctx.beginPath();
        ctx.moveTo(plot_left, counter_bottom);
        for (var i = 0; i <= steps; i++) {
            if (counter >= top) {
                counter = top;
                direction = -1;
            }

            var y = counter_bottom - y_per_count * counter;
            ctx.lineTo(plot_left + i * 5, y);
            ctx.lineTo(plot_left + (i + 1) * 5, y);
            counter += direction;
        }
        ctx.stroke();

        // Draw comparison reference line.
        ctx.beginPath();
        ctx.setLineDash([5]);
        let match_y = plot_left - y_per_count * match;
        ctx.moveTo(plot_left, match_y);
        ctx.lineTo(plot_left + 5 * steps, match_y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels for the counter.
        ctx.font = '12px serif';
        ctx.fillText('0', plot_left - 10, counter_bottom);
        ctx.fillText('c', plot_left - 10, match_y + 3);
        ctx.fillText('n', plot_left + 5 * top - 3, 6);

        // Draw the output waveform.
        counter = 0;
        direction = 1;
        ctx.beginPath();
        ctx.moveTo(plot_left, output_bottom);
        for (var i = 0; i <= steps; i++) {
            if (counter >= top) {
                counter = top;
                direction = -1;
            }

            var y = (counter >= match) ? (output_bottom - 50) : output_bottom;
            ctx.lineTo(plot_left + i * 5, y);
            ctx.lineTo(plot_left + (i + 1) * 5, y);
            counter += direction;
        }
        ctx.stroke();
    }
};

pwm.render();

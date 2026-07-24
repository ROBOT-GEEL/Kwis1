function rebootRobot(type) {

    if (type === 'robot-soft') {
        socket.emit('robot-reboot', { type: 'soft' });
    } 
    else if (type === 'robot-hard') {
        socket.emit('robot-reboot', { type: 'hard' });
    } 
    else if (type === 'pi-hard') {
        socket.emit('screen-reboot', { type: 'hard' });
    }
}
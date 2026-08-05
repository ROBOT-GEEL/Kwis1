/**
 * Script for the Easy Numpad functionality.
 * Depends on: jQuery
 */

$(document).ready(function () {
    $('.easy-get').on('click', (event) => {
        console.log("easy-get onclick");
        show_easy_numpad();
        
        try {
            socket.emit("robot-stop-for-x-time", { time: 4000 });
            Quiz.abortByScreenChange("Adminpaneel aangeklikt");
        } catch (error) {
            console.error("Fout bij het versturen van socket event:", error);
        }
    });
});

function show_easy_numpad() {
    // Added 'event' as a parameter to all onclick functions
    var easy_numpad = `
        <div class="easy-numpad-frame" id="easy-numpad-frame">
            <div class="easy-numpad-container">
                <div class="easy-numpad-output-container">
                    <p class="easy-numpad-output" id="easy-numpad-output"></p>
                </div>
                <div class="easy-numpad-number-container">
                    <table>
                        <tr>
                            <td><a href="7" onclick="easynum(event)">7</a></td>
                            <td><a href="8" onclick="easynum(event)">8</a></td>
                            <td><a href="9" onclick="easynum(event)">9</a></td>
                            <td><a href="Del" class="del" id="del" onclick="easy_numpad_del(event)">Del</a></td>
                        </tr>
                        <tr>
                            <td><a href="4" onclick="easynum(event)">4</a></td>
                            <td><a href="5" onclick="easynum(event)">5</a></td>
                            <td><a href="6" onclick="easynum(event)">6</a></td>
                            <td><a href="Clear" class="clear" id="clear" onclick="easy_numpad_clear(event)">Clear</a></td>
                        </tr>
                        <tr>
                            <td><a href="1" onclick="easynum(event)">1</a></td>
                            <td><a href="2" onclick="easynum(event)">2</a></td>
                            <td><a href="3" onclick="easynum(event)">3</a></td>
                            <td><a href="Cancel" class="cancel" id="cancel" onclick="easy_numpad_cancel(event)">Cancel</a></td>
                        </tr>
                        <tr>
                            <td colspan="3" onclick="easynum(event)"><a href="0">0</a></td>
                            <td><a href="Done" class="done" id="done" onclick="easy_numpad_done(event)">Done</a></td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    `;
    $('body').append(easy_numpad);
}

function easy_numpad_close() {
    $('#easy-numpad-frame').remove();
}

// Accept the event object as a parameter
function easynum(event) {
    event.preventDefault();

    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (navigator.vibrate) {
        navigator.vibrate(60);
    }

    var easy_num_button = $(event.target);
    var easy_num_value = easy_num_button.text();
    $('#easy-numpad-output').append(easy_num_value);
}

function easy_numpad_del(event) {
    event.preventDefault();
    var easy_numpad_output_val = $('#easy-numpad-output').text();
    var easy_numpad_output_val_deleted = easy_numpad_output_val.slice(0, -1);
    $('#easy-numpad-output').text(easy_numpad_output_val_deleted);
}

function easy_numpad_clear(event) {
    event.preventDefault();
    $('#easy-numpad-output').text("");
    console.log("clear output");
}

function easy_numpad_cancel(event) {
    event.preventDefault();
    $('#easy-numpad-frame').remove();
    console.log("cancel output");
}

async function easy_numpad_done(event) {
    event.preventDefault();
    var easy_numpad_output_val = $('#easy-numpad-output').text();
    $('.easy-put').val(easy_numpad_output_val);

    try {
        const response = await fetch('/auth/verifyPin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pin: easy_numpad_output_val }),
        });

        if (response.status === 200) {
            console.log("PIN verified successfully");
            easy_numpad_close();
            window.location.href = "../admin-panel";
        } else {
            console.log("Incorrect PIN");
        }

    } catch (error) {
        console.error('Error:', error);
    }
}
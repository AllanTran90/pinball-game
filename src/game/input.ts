export const inputState = {
    leftActive: false,
    rightActive: false,
};

export function setupInput(){
    function handleKeyDown(e: KeyboardEvent){
        if (e.key === "ArrowLeft") inputState.leftActive = true;
        if (e.key === "ArrowRight") inputState.rightActive = true;
    }

    function handleKeyUp(e: KeyboardEvent){
        if (e.key === "ArrowLeft") inputState.leftActive = false;
        if (e.key === "ArrowRight") inputState.rightActive = false;
    }
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return function cleanup() {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        
    }
}
    
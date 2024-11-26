import { useEffect, useState } from "react";
// import axios from "axios";

const App = () => {
    const [imageSrc, setImageSrc] = useState("");

    return (
        <div>
            <h1>RealityCanvas</h1>
            <img
                src="http://127.0.0.1:5000/video_feed"
                style={{ border: "1px solid black", maxWidth: "640px" }}
            />
        </div>
    );
};

export default App;
const config = {
    platform : "Sentinel-5 Precursor",
    crs: "EPSG:4326",
    url: "s5phub.copernicus.eu",
    username: "s5pguest",
    password: "s5pguest",
    zones: [
        {
            key: "puglia",
            value: [14.332, 39.505, 19.051, 42.307],
            days: 7
        }
    ],
    srid: 4326,
    chunk: 5000     // max stack storage in MB
}

export default config;

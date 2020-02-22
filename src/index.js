import React, { useState, useEffect, useCallback } from "react";
import { render } from "react-dom";
import Gallery from "react-photo-gallery";
import Carousel, { Modal, ModalGateway } from "react-images";
//import { photos } from "./photos";

import Amplify from "@aws-amplify/core";
import API, { graphqlOperation } from "@aws-amplify/api";
import aws_exports from "./aws-exports";

Amplify.configure(aws_exports);

async function SearchImages(query, from, size) {
	const SearchQuery = `query {
        search(text: "${query}", from: "${from}", size: "${size}") {
        results {
            name
            s3Path
            width
            height
        }
        hits
        }
    }`;

	var gql = await API.graphql(graphqlOperation(SearchQuery));
	console.log(gql.data.search.results);
	var result = gql.data.search.results.map(function(x) {
		return { src: x.s3Path, width: parseInt(x.width, 10), height: parseInt(x.height, 10) };
	});
	console.log(result);
	return result;
}

async function GetPhotos() {
	var photos = await SearchImages("mega", 0, 50);
	return photos;
}

function App() {
	const [currentImage, setCurrentImage] = useState(0);
	const [viewerIsOpen, setViewerIsOpen] = useState(false);
	const [photos, setPhotos] = useState();

	useEffect(() => {
		async function fetchData() {
			var photos = await GetPhotos();
			setPhotos(photos);
		}
		fetchData();
	}, []);

	console.log(photos);

	const openLightbox = useCallback((event, { photo, index }) => {
		setCurrentImage(index);
		setViewerIsOpen(true);
	}, []);

	const closeLightbox = () => {
		setCurrentImage(0);
		setViewerIsOpen(false);
	};

	return photos ? (
		<div>
			<Gallery photos={photos} onClick={openLightbox} />
			<ModalGateway>
				{viewerIsOpen ? (
					<Modal onClose={closeLightbox}>
						<Carousel
							currentIndex={currentImage}
							views={photos.map(x => ({
								...x,
								srcset: x.srcSet,
								caption: x.title,
							}))}
						/>
					</Modal>
				) : null}
			</ModalGateway>
		</div>
	) : (
		<div>Loading...</div>
	);
}

render(<App />, document.getElementById("app"));

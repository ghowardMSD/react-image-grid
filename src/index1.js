import React, { useState, useEffect, useCallback } from "react";
//import { render } from "react-dom";
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
      }
    hits
    }
  }`;

	var gql = await API.graphql(graphqlOperation(SearchQuery));
	//console.log(gql.data.search.results);
	var photos = gql.data.search.results.map(async function(x) {
		const SignedPathQuery = `query {
      getImageSignedPath(imageName: "${x.name}") 
    }`;
		const gql = await API.graphql(graphqlOperation(SignedPathQuery));
		//console.log(gql.data.getImageSignedPath);
		return { src: gql.data.getImageSignedPath, width: 4, height: 3 };
	});
	var result = await Promise.all(photos);
	console.log(result);
	return result;
}

async function GetPhotos() {
	var photos = await SearchImages("Queen", 0, 50);
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

	return (
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
	);
}

render(<App />, document.getElementById("app"));

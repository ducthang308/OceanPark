import React from 'react'
import Navbar from "./components/Navbar/navbar.tsx"
import Listing from "./components/ListingPage/listing.tsx"
import HeaderListing from './components/HeaderManagement/HeaderListing/headerListing.tsx'
import HeaderList from './components/HeaderManagement/HeaderList/headerListing.tsx'
import ListPost from './components/ListPostPage/listPost.tsx'
import "./ManagementPage.css"

const managementPage = () => {
    return (
        <div className="container-management">
            <Navbar></Navbar>
            <div className="management-content">
                <HeaderList></HeaderList>
                <ListPost></ListPost>
            </div>
        </div>
    )
}

export default managementPage
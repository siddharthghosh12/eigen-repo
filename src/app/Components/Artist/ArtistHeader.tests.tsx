import { screen } from "@testing-library/react-native"
import { ArtistHeaderTestsQuery } from "__generated__/ArtistHeaderTestsQuery.graphql"
import { ArtistHeaderFragmentContainer } from "app/Components/Artist/ArtistHeader"
import { setupTestWrapper } from "app/utils/tests/setupTestWrapper"
import { graphql } from "react-relay"

describe("ArtistHeader", () => {
  const { renderWithRelay } = setupTestWrapper<ArtistHeaderTestsQuery>({
    Component: ({ artist }) => <ArtistHeaderFragmentContainer artist={artist!} />,
    query: graphql`
      query ArtistHeaderTestsQuery($artistID: String!) @relay_test_operation {
        artist(id: $artistID) {
          ...ArtistHeader_artist
        }
      }
    `,
    variables: { artistID: "artist-id" },
  })

  it("renders", () => {
    renderWithRelay({
      Artist: () => mockArtist,
    })

    expect(screen.queryByText("Follow")).toBeOnTheScreen()
    expect(screen.queryByLabelText("Marcel cover image")).toBeOnTheScreen()
  })

  it("does not show followers count when it is < 2", () => {
    renderWithRelay({
      Artist: () => ({ ...mockArtist, counts: { follows: 1 } }),
    })

    expect(screen.queryByText("1 followers")).not.toBeOnTheScreen()
  })
})

const mockArtist = {
  internalID: "some-id",
  id: "marcel-duchamp",
  name: "Marcel",
  nationality: "French",
  birthday: "11/17/1992",
  counts: {
    follows: 22,
  },
}

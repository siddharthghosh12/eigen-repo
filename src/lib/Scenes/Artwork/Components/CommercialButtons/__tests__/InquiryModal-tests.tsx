jest.mock("../../../../../utils/googleMaps", () => ({ queryLocation: jest.fn() }))

import { InquiryModalTestsQuery, InquiryModalTestsQueryResponse } from "__generated__/InquiryModalTestsQuery.graphql"
import { FancyModalHeader } from "lib/Components/FancyModal/FancyModalHeader"
import { Input } from "lib/Components/Input/Input"
import { extractText } from "lib/tests/extractText"
import { renderWithWrappers } from "lib/tests/renderWithWrappers"
import { ArtworkInquiryContext, ArtworkInquiryStateProvider } from "lib/utils/ArtworkInquiry/ArtworkInquiryStore"
import { queryLocation } from "lib/utils/googleMaps"
import { Touchable } from "palette"
import React from "react"
import { graphql, QueryRenderer } from "react-relay"
import { act } from "react-test-renderer"
import { createMockEnvironment, MockPayloadGenerator } from "relay-test-utils"
import { InquiryModalFragmentContainer } from "../InquiryModal"
import { ShippingModal } from "../ShippingModal"
import { press, typeInInput } from "./helpers"
jest.unmock("react-relay")

let env: ReturnType<typeof createMockEnvironment>

// TODO: add the other modal props
const modalProps = {
  modalIsVisible: true,
  toggleVisibility: jest.fn(),
}

interface RenderComponentProps {
  props: InquiryModalTestsQueryResponse | null
  error: Error | null
}

const renderComponent = ({ props, error }: RenderComponentProps) => {
  if (props?.artwork) {
    return (
      <ArtworkInquiryStateProvider>
        <InquiryModalFragmentContainer artwork={props!.artwork!} {...modalProps} />
      </ArtworkInquiryStateProvider>
    )
  } else if (error) {
    console.log(error)
  }
}

const initialState = {
  shippingLocation: null,
  inquiryType: null,
  inquiryQuestions: [],
}

const mockDispatch = jest.fn()

const renderComponentWithDispatch = ({ props, error }: RenderComponentProps) => {
  if (props?.artwork) {
    return (
      <ArtworkInquiryContext.Provider value={{ state: initialState, dispatch: mockDispatch }}>
        <InquiryModalFragmentContainer artwork={props!.artwork!} {...modalProps} />
      </ArtworkInquiryContext.Provider>
    )
  } else if (error) {
    console.log(error)
  }
}

interface TestRenderProps {
  renderer: (props: RenderComponentProps) => JSX.Element | undefined
}

const TestRenderer = ({ renderer }: TestRenderProps) => (
  <QueryRenderer<InquiryModalTestsQuery>
    environment={env}
    query={graphql`
      query InquiryModalTestsQuery @relay_test_operation {
        artwork(id: "pumpkins") {
          ...InquiryModal_artwork
        }
      }
    `}
    variables={{}}
    render={renderer}
  />
)

const mockResolver = {
  Artwork: () => ({
    inquiryQuestions: [
      { internalID: "price_and_availability", question: "Price & Availability" },
      { internalID: "shipping_quote", question: "Shipping" },
      { internalID: "condition_and_provenance", question: "Condition & Provance" },
    ],
  }),
}

const getWrapper = (mockResolvers = mockResolver, renderer = renderComponent) => {
  const tree = renderWithWrappers(<TestRenderer renderer={renderer} />)
  act(() => {
    env.mock.resolveMostRecentOperation((operation) => {
      return MockPayloadGenerator.generate(operation, mockResolvers)
    })
  })
  return tree
}

beforeEach(() => {
  env = createMockEnvironment()
})

describe("<InquiryModal />", () => {
  it("renders the modal", () => {
    const tree = getWrapper()
    expect(extractText(tree.root)).toContain("What information are you looking for?")
  })

  describe("user can select 'Price & Availability'", () => {
    it.todo("user taps checkbox and option is selected")
  })

  describe("user can select 'Condition & Provenance'", () => {
    it("user taps checkbox and option is selected", () => {
      const wrapper = getWrapper(mockResolver, renderComponentWithDispatch)
      wrapper.root.findByProps({ "data-test-id": "checkbox-condition_and_provenance" }).props.onPress()

      expect(mockDispatch).toBeCalledWith({
        payload: {
          details: null,
          isChecked: true,
          questionID: "condition_and_provenance",
        },
        type: "selectInquiryQuestion",
      })
    })
  })

  describe("user can select Shipping", () => {
    it("user selecting shipping exposes the 'Add your location' CTA", () => {
      const wrapper = getWrapper()
      wrapper.root.findByProps({ "data-test-id": "checkbox-shipping_quote" }).props.onPress()

      expect(extractText(wrapper.root)).toContain("Add your location")
    })

    it("user can visit shipping modal", async () => {
      const wrapper = getWrapper()
      wrapper.root.findByProps({ "data-test-id": "checkbox-shipping_quote" }).props.onPress()

      expect(extractText(wrapper.root)).toContain("Add your location")
      expect(wrapper.root.findByType(ShippingModal).props.modalIsVisible).toBeFalsy()

      await press(wrapper.root, { text: /^Add your location/ })

      expect(wrapper.root.findByType(ShippingModal).props.modalIsVisible).toBeTruthy()
      const header = wrapper.root.findByType(ShippingModal).findByType(FancyModalHeader)
      expect(extractText(header)).toContain("Add Location")
    })

    it("User adds a location from the shipping modal", async () => {
      ;(queryLocation as jest.Mock).mockResolvedValue([
        { id: "a", name: "Coxsackie, NY, USA" },
        { id: "b", name: "Coxs Creek, KY, USA" },
      ])
      const wrapper = getWrapper()
      wrapper.root.findByProps({ "data-test-id": "checkbox-shipping_quote" }).props.onPress()
      await press(wrapper.root, { text: /^Add your location/ })

      await typeInInput(wrapper.root, "Cox")

      expect(wrapper.root.findAllByProps({ "data-test-id": "dropdown" }).length).not.toEqual(0)
      expect(extractText(wrapper.root)).toContain("Coxsackie, NY, USA")

      await press(wrapper.root, { text: "Coxsackie, NY, USA", componentType: Touchable })
      expect(wrapper.root.findByType(Input).props.value).toEqual("Coxsackie, NY, USA")
      expect(wrapper.root.findAllByProps({ "data-test-id": "dropdown" }).length).toEqual(0)

      await press(wrapper.root, { text: "Apply" })
      expect(wrapper.root.findByType(ShippingModal).props.modalIsVisible).toBeFalsy()

      expect(extractText(wrapper.root)).toContain("Coxsackie, NY, USA")
    })

    // TODO: I couldn't get this one to work. It is pretty basic. maybe we don't need it.
    it.skip("user can only exit the shipping modal by pressing cancel if they have not selected a location", async () => {
      const wrapper = getWrapper()
      wrapper.root.findByProps({ "data-test-id": "checkbox-shipping_quote" }).props.onPress()
      await press(wrapper.root, { text: /^Add your location/ })
      await press(wrapper.root, { text: "Apply" })

      expect(wrapper.root.findByType(ShippingModal).props.modalIsVisible).toBeTruthy()

      await press(wrapper.root, { text: "Cancel" })
      expect(wrapper.root.findByType(ShippingModal).props.modalIsVisible).toBeFalsy()
    })
  })
})

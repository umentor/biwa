import { Controller } from "stimulus";

export default class extends Controller {
  toggleScreenshot(event) {
    event.target.nextElementSibling.classList.toggle("hidden");
    event.preventDefault();
  }
}
